import * as AST from './AST';

// Maps known TS/Node.js module names to their Java wrapper class names
const MODULE_MAP: Record<string, string> = {
  'fs': 'Fs',
  'http': 'Http',
};

// Maps JS global objects to their Java wrapper class names
const GLOBAL_REWRITES: Record<string, string> = {
  'JSON': 'Json',
};

export class CodeGenerator {
  private indentLevel: number = 0;
  private className: string;
  // Maps imported identifiers to their Java wrapper class name
  // e.g. { 'writeFile': 'Fs', 'http': 'Http' }
  private importAliases: Map<string, string> = new Map();

  constructor(className: string = 'Main') {
    this.className = className;
  }

  generate(program: AST.Program): string {
    let output = '';

    // Reset aliases for each generation
    this.importAliases = new Map();
    this.variableTypes.clear();

    // Collect imports and top-level definitions
    const imports: string[] = [];
    const classDeclarations: string[] = [];
    const topLevelStatements: AST.Statement[] = [];

    for (const stmt of program.body) {
      if (stmt.type === 'ImportDeclaration') {
        const importSrc = stmt.source.type === 'JavaPackageSource'
          ? stmt.source.path.join('.') + (stmt.source.wildcard ? '.*' : '')
          : stmt.source.value as string;

        if (stmt.source.type === 'JavaPackageSource') {
          imports.push(`import ${importSrc};`);
        } else if (stmt.source.type === 'Literal' && typeof stmt.source.value === 'string' && MODULE_MAP[stmt.source.value]) {
          // Mapped module (e.g. 'fs' -> Fs, 'http' -> Http)
          const javaClass = MODULE_MAP[stmt.source.value]!;
          // Track all imported identifiers so we can rewrite calls later
          for (const spec of stmt.specifiers) {
            if (spec.type === 'ImportDefaultSpecifier') {
              // e.g. import http from 'http' -> http.get(...) becomes Http.get(...)
              this.importAliases.set(spec.local.name, javaClass);
            } else if (spec.type === 'ImportSpecifier') {
              // e.g. import { writeFile } from 'fs' -> writeFile(...) becomes Fs.writeFile(...)
              this.importAliases.set(spec.local.name, javaClass);
            }
          }
          // No Java import statement needed — wrappers are on the classpath in default package
        } else {
          // Unknown literal import -> keep as comment
          imports.push(`// import from ${importSrc}`);
        }
      } else if (stmt.type === 'ClassDeclaration') {
        classDeclarations.push(this.visitClassDeclaration(stmt));
      } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'ClassDeclaration') {
        classDeclarations.push(this.visitClassDeclaration(stmt.declaration as AST.ClassDeclaration));
      } else {
        topLevelStatements.push(stmt);
      }
    }

    if (imports.length > 0) {
      output += imports.join('\n') + '\n\n';
    }

    // Output any top-level classes explicitly declared
    if (classDeclarations.length > 0) {
      output += classDeclarations.join('\n\n') + '\n\n';
    }

    // Wrap the rest of the file top-level statements in a synthetic Main class
    if (topLevelStatements.length > 0) {
      output += `public class ${this.className} {\n`;
      this.indentLevel++;

      // Separate top-level functions from executable statements to place them as static methods
      const functions: AST.FunctionDeclaration[] = [];
      const nestedClasses: AST.InterfaceDeclaration[] = [];
      const executableStatements: AST.Statement[] = [];

      for (const stmt of topLevelStatements) {
        if (stmt.type === 'FunctionDeclaration') {
          functions.push(stmt);
          if (stmt.id) this.declaredFunctions.add(stmt.id.name);
        } else if (stmt.type === 'InterfaceDeclaration') {
          nestedClasses.push(stmt as AST.InterfaceDeclaration);
        } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'FunctionDeclaration') {
          functions.push(stmt.declaration as AST.FunctionDeclaration);
        } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'VariableDeclaration') {
          executableStatements.push(stmt.declaration);
        } else if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'ClassDeclaration') {
          // Handled above
        } else if (stmt.type === 'ExportNamedDeclaration' && !stmt.declaration) {
          // export { var }
        } else {
          executableStatements.push(stmt);
        }
      }

      for (const nc of nestedClasses) {
        output += this.visitInterfaceDeclaration(nc) + '\n';
      }

      for (const func of functions) {
        output += this.indent() + this.visitFunctionDeclaration(func, true) + '\n\n';
      }

      output += this.indent() + 'public static void main(String[] args) {\n';
      this.indentLevel++;
      for (const stmt of executableStatements) {
        output += this.indent() + this.visitStatement(stmt) + '\n';
      }
      this.indentLevel--;
      output += this.indent() + '}\n';

      this.indentLevel--;
      output += '}\n';
    } else if (classDeclarations.length === 0) {
      // Empty file
      output += `public class ${this.className} {\n  public static void main(String[] args) {}\n}\n`;
    }

    return output;
  }

  private visitStatement(stmt: AST.Statement): string {
    switch (stmt.type) {
      case 'VariableDeclaration': return this.visitVariableDeclaration(stmt);
      case 'FunctionDeclaration': return this.visitFunctionDeclaration(stmt);
      case 'ClassDeclaration': return this.visitClassDeclaration(stmt);
      case 'BlockStatement': return this.visitBlockStatement(stmt);
      case 'ExpressionStatement': return this.visitExpressionStatement(stmt);
      case 'IfStatement': return this.visitIfStatement(stmt);
      case 'ForStatement': return this.visitForStatement(stmt);
      case 'ForOfStatement': return this.visitForOfStatement(stmt);
      case 'WhileStatement': return this.visitWhileStatement(stmt);
      case 'ReturnStatement': return this.visitReturnStatement(stmt);
      case 'ThrowStatement': return this.visitThrowStatement(stmt);
      case 'TryStatement': return this.visitTryStatement(stmt);
      case 'SwitchStatement': return this.visitSwitchStatement(stmt);
      case 'BreakStatement': return 'break;';
      case 'InterfaceDeclaration': return this.visitInterfaceDeclaration(stmt as AST.InterfaceDeclaration);
      case 'ExportNamedDeclaration': return stmt.declaration ? this.visitStatement(stmt.declaration) : '';
      default: return `// Unhandled statement: ${stmt.type}`;
    }
  }

  // Track variables that should be StringBuilder for lambda safety
  private stringBuilderVars: Set<string> = new Set();
  // Track variables that hold JSON parsed objects (for property access rewriting)
  private jsonObjectVars: Set<string> = new Set();
  // Track declared function names (for method reference conversion)
  private declaredFunctions: Set<string> = new Set();
  // Map variable names to their Java type for intelligent method routing
  private variableTypes: Map<string, string> = new Map();

  private visitVariableDeclaration(decl: AST.VariableDeclaration): string {
    return decl.declarations.map(d => {
      // In Java, `var` is supported in newer versions, but we should map correctly if possible.
      let typeStr = 'var';
      if (d.typeAnnotation) {
        typeStr = this.mapType(d.typeAnnotation);
      } else if (decl.kind === 'const') {
        typeStr = 'final var';
      }

      // For mutable string variables (let), use StringBuilder to allow mutation in lambdas
      if (decl.kind === 'let' && typeStr === 'String') {
        this.stringBuilderVars.add(d.id.name);
        const initVal = d.init ? this.visitExpression(d.init) : '""';
        return `StringBuilder ${d.id.name} = new StringBuilder(${initVal});`;
      }

      // Track variables initialized from Json.parse() for property access rewriting
      if (d.init && d.init.type === 'CallExpression' && d.init.callee.type === 'MemberExpression'
        && d.init.callee.object.type === 'Identifier' && d.init.callee.object.name === 'JSON'
        && d.init.callee.property.name === 'parse') {
        this.jsonObjectVars.add(d.id.name);
        const init = ` = ${this.visitExpression(d.init)}`;
        return `var ${d.id.name}${init};`;
      }

      this.variableTypes.set(d.id.name, typeStr);
      const init = d.init ? ` = ${this.visitExpression(d.init)}` : '';
      return `${typeStr} ${d.id.name}${init};`;
    }).join('\n' + this.indent());
  }

  private visitFunctionDeclaration(decl: AST.FunctionDeclaration, isStatic: boolean = false): string {
    const modifiers = isStatic ? 'public static' : 'public';
    const returnType = decl.returnType ? this.mapType(decl.returnType) : 'void';

    // Detect HTTP handler pattern: 2 params both typed as 'any'
    const isHttpHandler = decl.params.length === 2
      && decl.params.every(p => p.typeAnnotation?.type === 'KeywordType' && (p.typeAnnotation as any).name === 'any');

    const params = decl.params.map((p, i) => {
      if (isHttpHandler) {
        // Map to Http.ServerRequest / Http.ServerResponse
        const httpType = i === 0 ? 'Http.ServerRequest' : 'Http.ServerResponse';
        this.variableTypes.set(p.name, httpType);
        return `${httpType} ${p.name}`;
      }
      const pType = p.typeAnnotation ? this.mapType(p.typeAnnotation) : 'Object';
      this.variableTypes.set(p.name, pType);
      return `${pType} ${p.name}`;
    }).join(', ');

    let funcStr = `${modifiers} ${returnType} ${decl.id?.name || 'anonymous'}(${params}) `;
    funcStr += this.visitBlockStatement(decl.body);
    return funcStr;
  }

  private visitClassDeclaration(decl: AST.ClassDeclaration): string {
    // Only one public class is allowed per file in Java. 
    // We will drop public modifier on extra exported classes for compilation ease within the same synthetic file.
    let clsStr = `class ${decl.id.name} {\n`;
    this.indentLevel++;
    for (const member of decl.body.body) {
      if (member.type === 'PropertyDefinition') {
        const type = member.typeAnnotation ? this.mapType(member.typeAnnotation) : 'Object';
        const init = member.value ? ` = ${this.visitExpression(member.value)}` : '';
        clsStr += this.indent() + `public ${type} ${member.key.name}${init};\n`;
      } else if (member.type === 'MethodDefinition') {
        const returnType = member.returnType ? this.mapType(member.returnType) : (member.kind === 'constructor' ? '' : 'void');
        const params = member.params.map(p => {
          const pType = p.typeAnnotation ? this.mapType(p.typeAnnotation) : 'Object';
          return `${pType} ${p.name}`;
        }).join(', ');

        const name = member.kind === 'constructor' ? decl.id.name : member.key.name;
        clsStr += '\n' + this.indent() + `public ${returnType} ${name}(${params}) ${this.visitBlockStatement(member.body)}\n`;
      }
    }
    this.indentLevel--;
    clsStr += this.indent() + '}';
    return clsStr;
  }

  private visitBlockStatement(block: AST.BlockStatement): string {
    let blkStr = '{\n';
    this.indentLevel++;
    for (const stmt of block.body) {
      blkStr += this.indent() + this.visitStatement(stmt) + '\n';
    }
    this.indentLevel--;
    blkStr += this.indent() + '}';
    return blkStr;
  }

  private visitExpressionStatement(exprStmt: AST.ExpressionStatement): string {
    return this.visitExpression(exprStmt.expression) + ';';
  }

  private visitIfStatement(ifStmt: AST.IfStatement): string {
    // In Java, bare identifiers can't be used as booleans (JS truthiness).
    // Convert `if (x)` to `if (x != null)` for non-boolean identifiers.
    let testStr: string;
    if (ifStmt.test.type === 'Identifier') {
      testStr = `${ifStmt.test.name} != null`;
    } else {
      testStr = this.visitExpression(ifStmt.test);
    }
    let str = `if (${testStr}) \n`;
    this.indentLevel++;
    str += this.indent() + this.visitStatement(ifStmt.consequent);
    this.indentLevel--;
    if (ifStmt.alternate) {
      // Handle else-if: emit `else if (...)` inline
      if (ifStmt.alternate.type === 'IfStatement') {
        str += '\n' + this.indent() + 'else ' + this.visitIfStatement(ifStmt.alternate as AST.IfStatement);
      } else {
        str += '\n' + this.indent() + 'else \n';
        this.indentLevel++;
        str += this.indent() + this.visitStatement(ifStmt.alternate);
        this.indentLevel--;
      }
    }
    return str;
  }

  private visitInterfaceDeclaration(decl: AST.InterfaceDeclaration): string {
    let str = `public static class ${decl.id.name} {\n`;
    this.indentLevel++;
    for (const prop of decl.body.properties) {
      const javaType = this.mapType(prop.typeAnnotation);
      str += this.indent() + `public ${javaType} ${prop.key.name};\n`;
    }
    this.indentLevel--;
    str += this.indent() + `}\n`;
    return str;
  }

  private visitForOfStatement(stmt: AST.ForOfStatement): string {
    // @ts-ignore
    const varName = stmt.left.declarations[0].id.name;
    const typeModifier = stmt.left.kind === 'const' ? 'final var' : 'var';
    let str = `for (${typeModifier} ${varName} : ${this.visitExpression(stmt.right)}) {\n`;
    this.indentLevel++;
    str += this.indent() + this.visitStatement(stmt.body);
    this.indentLevel--;
    str += '\n' + this.indent() + '}';
    return str;
  }

  private visitForStatement(stmt: AST.ForStatement): string {
    let initStr = '';
    if (stmt.init) {
      // visitStatement will return something like "double i = 0;"
      // We strip the trailing semicolon because the for (...) syntax requires it without the trailing semicolon
      // (Actually, Java `for` loop *has* the semicolon, but if we format it like `for (init; test; update)`, 
      // we need to inject the semicolons ourselves, so we strip from init.
      initStr = this.visitStatement(stmt.init).trim().replace(/;$/, '');
    }
    const testStr = stmt.test ? this.visitExpression(stmt.test) : '';
    const updateStr = stmt.update ? this.visitExpression(stmt.update) : '';

    let str = `for (${initStr}; ${testStr}; ${updateStr}) `;
    if (stmt.body.type === 'BlockStatement') {
      str += this.visitBlockStatement(stmt.body);
    } else {
      str += '\\n';
      this.indentLevel++;
      str += this.indent() + this.visitStatement(stmt.body);
      this.indentLevel--;
    }
    return str;
  }

  private visitWhileStatement(stmt: AST.WhileStatement): string {
    const testStr = this.visitExpression(stmt.test);
    let str = `while (${testStr}) `;
    if (stmt.body.type === 'BlockStatement') {
      str += this.visitBlockStatement(stmt.body);
    } else {
      str += '\\n';
      this.indentLevel++;
      str += this.indent() + this.visitStatement(stmt.body);
      this.indentLevel--;
    }
    return str;
  }

  private visitReturnStatement(retStmt: AST.ReturnStatement): string {
    return `return${retStmt.argument ? ' ' + this.visitExpression(retStmt.argument) : ''};`;
  }

  private visitThrowStatement(throwStmt: AST.ThrowStatement): string {
    return `throw ${this.visitExpression(throwStmt.argument)};`;
  }

  private visitTryStatement(stmt: AST.TryStatement): string {
    let str = 'try ';
    str += this.visitBlockStatement(stmt.block);
    if (stmt.handler) {
      str += ' catch (';
      if (stmt.handler.param) {
        const typeStr = stmt.handler.paramType ? this.mapType(stmt.handler.paramType) : 'Exception';
        // JS Error -> Java Exception or RuntimeException
        const mappedType = typeStr === 'any' || typeStr === 'Object' ? 'Exception' : (typeStr === 'Error' ? 'Exception' : typeStr);
        str += `${mappedType} ${stmt.handler.param.name}`;
      } else {
        str += 'Exception e';
      }
      str += ') ';
      str += this.visitBlockStatement(stmt.handler.body);
    }
    if (stmt.finalizer) {
      str += ' finally ';
      str += this.visitBlockStatement(stmt.finalizer);
    }
    return str;
  }

  private visitSwitchStatement(stmt: AST.SwitchStatement): string {
    let discrimStr = this.visitExpression(stmt.discriminant);
    if (stmt.discriminant.type === 'Identifier') {
      const type = this.variableTypes.get(stmt.discriminant.name);
      if (type === 'double') discrimStr = `(int) (${discrimStr})`;
    } else if (stmt.discriminant.type === 'Literal' && typeof stmt.discriminant.value === 'number') {
      discrimStr = `(int) (${discrimStr})`;
    }

    let str = `switch (${discrimStr}) {\n`;
    this.indentLevel++;
    for (const c of stmt.cases) {
      if (c.test) {
        str += this.indent() + `case ${this.visitExpression(c.test)}:\n`;
      } else {
        str += this.indent() + `default:\n`;
      }
      this.indentLevel++;
      for (const s of c.consequent) {
        str += this.indent() + this.visitStatement(s) + '\n';
      }
      this.indentLevel--;
    }
    this.indentLevel--;
    str += this.indent() + '}';
    return str;
  }

  // Expressions
  private visitExpression(expr: AST.Expression): string {
    switch (expr.type) {
      case 'TemplateLiteral': {
        let javaExpr = (expr as AST.TemplateLiteral).value;
        javaExpr = javaExpr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        javaExpr = javaExpr.replace(/\$\{([^}]+)\}/g, 'X_PLUS_$1_PLUS_X');
        javaExpr = '"' + javaExpr + '"';
        javaExpr = javaExpr.replace(/X_PLUS_(.+?)_PLUS_X/g, '" + $1 + "');
        javaExpr = javaExpr.replace(/^"" \+ /, '');
        javaExpr = javaExpr.replace(/ \+ ""$/, '');
        return javaExpr;
      }
      case 'Literal': {
        // Escape inner double quotes in string literals for Java
        if (typeof expr.value === 'string') {
          const escaped = expr.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          return `"${escaped}"`;
        }
        // For numbers, emit integers without decimal point
        if (typeof expr.value === 'number' && Number.isInteger(expr.value)) {
          return String(expr.value);
        }
        return expr.raw;
      }
      case 'UnaryExpression': {
        return `${expr.operator}${this.visitExpression(expr.argument)}`;
      }
      case 'Identifier': {
        return expr.name;
      }
      case 'BinaryExpression': {
        // Convert === / !== with string literals to .equals() in Java
        if ((expr.operator === '===' || expr.operator === '==') && expr.right.type === 'Literal' && typeof expr.right.value === 'string') {
          return `${this.visitExpression(expr.right)}.equals(${this.visitExpression(expr.left)})`;
        }
        if ((expr.operator === '!==' || expr.operator === '!=') && expr.right.type === 'Literal' && typeof expr.right.value === 'string') {
          return `!${this.visitExpression(expr.right)}.equals(${this.visitExpression(expr.left)})`;
        }
        if ((expr.operator === '===' || expr.operator === '==') && expr.left.type === 'Literal' && typeof expr.left.value === 'string') {
          return `${this.visitExpression(expr.left)}.equals(${this.visitExpression(expr.right)})`;
        }
        if ((expr.operator === '!==' || expr.operator === '!=') && expr.left.type === 'Literal' && typeof expr.left.value === 'string') {
          return `!${this.visitExpression(expr.left)}.equals(${this.visitExpression(expr.right)})`;
        }

        // Map JS strict equality to Java equality
        let javaOp = expr.operator;
        if (javaOp === '===') javaOp = '==';
        if (javaOp === '!==') javaOp = '!=';

        return `${this.visitExpression(expr.left)} ${javaOp} ${this.visitExpression(expr.right)} `;
      }
      case 'AssignmentExpression': {
        // Handle StringBuilder vars: data += chunk -> data.append(chunk)
        if (expr.operator === '+=' && expr.left.type === 'Identifier' && this.stringBuilderVars.has(expr.left.name)) {
          return `${expr.left.name}.append(${this.visitExpression(expr.right)})`;
        }
        // Handle JSON object property set: obj.name = "Bob" -> obj.set("name", "Bob")
        if (expr.operator === '=' && expr.left.type === 'MemberExpression'
          && expr.left.object.type === 'Identifier' && this.jsonObjectVars.has(expr.left.object.name)) {
          return `${expr.left.object.name}.set("${expr.left.property.name}", ${this.visitExpression(expr.right)})`;
        }
        return `${this.visitExpression(expr.left)} ${expr.operator} ${this.visitExpression(expr.right)} `;
      }
      case 'CallExpression': return this.visitCallExpression(expr);
      case 'MemberExpression': {
        if (expr.property.name === 'length') {
          if (expr.object.type === 'Identifier') {
            const type = this.variableTypes.get(expr.object.name);
            if (type && type.endsWith('[]')) {
              return `${this.visitExpression(expr.object)}.length`;
            }
          }
          return `${this.visitExpression(expr.object)}.length()`;
        }

        // Rewrite default-import member expressions: http.get(...) -> Http.get(...)
        if (expr.object.type === 'Identifier' && this.importAliases.has(expr.object.name)) {
          return `${this.importAliases.get(expr.object.name)}.${expr.property.name} `;
        }
        // Rewrite JS globals: JSON.parse -> Json.parse
        if (expr.object.type === 'Identifier' && GLOBAL_REWRITES[expr.object.name]) {
          return `${GLOBAL_REWRITES[expr.object.name]}.${expr.property.name} `;
        }
        // Rewrite JSON object property access: obj.name -> obj.get("name")
        if (expr.object.type === 'Identifier' && this.jsonObjectVars.has(expr.object.name)) {
          return `${expr.object.name}.get("${expr.property.name}")`;
        }
        return `${this.visitExpression(expr.object)}.${expr.property.name}`;
      }
      case 'ArrowFunctionExpression': return this.visitArrowFunctionExpression(expr);
      case 'ArrayExpression': {
        if (expr.elements.length === 0) return 'new Object[]{}';
        let javaType = 'Object';
        const firstClass = expr.elements[0]?.type;
        if (firstClass === 'Literal') {
          if (typeof (expr.elements[0] as AST.Literal).value === 'number') javaType = 'double';
          else if (typeof (expr.elements[0] as AST.Literal).value === 'string') javaType = 'String';
          else if (typeof (expr.elements[0] as AST.Literal).value === 'boolean') javaType = 'boolean';
        }
        return `new ${javaType}[]{${expr.elements.map(e => this.visitExpression(e)).join(', ')}}`;
      }
      case 'NewExpression': {
        const calleeStr = this.visitExpression(expr.callee);
        const mappedCallee = calleeStr === 'Error' ? 'RuntimeException' : calleeStr;
        return `new ${mappedCallee}(${expr.arguments.map(a => this.visitExpression(a)).join(', ')})`;
      }
      // @ts-ignore
      default: return `/* Unhandled Expression: ${expr.type} */`;
    }
  }

  private visitArrowFunctionExpression(expr: AST.ArrowFunctionExpression): string {
    const params = expr.params.map(p => p.name).join(', ');
    const bodyStr = expr.body.type === 'BlockStatement'
      ? this.visitBlockStatement(expr.body)
      : this.visitExpression(expr.body);

    // Java lambda format: (param1, param2) -> { body }
    return `(${params}) -> ${bodyStr} `;
  }

  private visitCallExpression(call: AST.CallExpression): string {
    // Check for `console.log` standard mapping and other native method intercepts
    if (call.callee.type === 'MemberExpression') {
      const calleeObjStr = this.visitExpression(call.callee.object);
      const prop = call.callee.property.name;

      if (calleeObjStr === 'console' && prop === 'log') {
        return `System.out.println(${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
      }

      if (prop === 'includes') {
        return `${calleeObjStr}.contains(${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
      }
    }

    // Check for named-import direct calls: writeFile(...) -> Fs.writeFile(...)
    if (call.callee.type === 'Identifier' && this.importAliases.has(call.callee.name)) {
      const javaClass = this.importAliases.get(call.callee.name);
      return `${javaClass}.${call.callee.name} (${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
    }

    return `${this.visitExpression(call.callee)} (${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
  }

  // Visit an expression used as a function argument — converts StringBuilder to String via .toString(),
  // and converts function references to Java method references.
  private visitArgExpression(expr: AST.Expression): string {
    // Convert bare function references to Java method references: handler -> ClassName::handler
    if (expr.type === 'Identifier' && this.declaredFunctions.has(expr.name)) {
      return `${this.className}::${expr.name} `;
    }
    const result = this.visitExpression(expr);
    if (expr.type === 'Identifier' && this.stringBuilderVars.has(expr.name)) {
      return `${result}.toString()`;
    }
    return result;
  }

  // Utilities
  private mapType(typeNode: AST.TypeNode): string {
    if (typeNode.type === 'KeywordType') {
      switch (typeNode.name) {
        case 'number': return 'double';
        case 'string': return 'String';
        case 'boolean': return 'boolean';
        case 'void': return 'void';
        case 'any': return 'Object';
        case 'null': return 'Object';
        default: return 'Object';
      }
    } else if (typeNode.type === 'TypeReference') {
      if ((typeNode as AST.TypeReference).typeName.type === 'Identifier') {
        return ((typeNode as AST.TypeReference).typeName as AST.Identifier).name;
      } else {
        // QualifiedName logic
        return 'Object'; // simplified for now
      }
    } else if (typeNode.type === 'ArrayType') {
      return this.mapType((typeNode as AST.ArrayType).elementType) + '[]';
    } else if (typeNode.type === 'UnionType') {
      const firstType = (typeNode as AST.UnionType).types[0];
      return firstType ? this.mapType(firstType) : 'Object';
    }
    return 'Object';
  }

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }
}
