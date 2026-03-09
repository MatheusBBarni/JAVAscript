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
      const executableStatements: AST.Statement[] = [];

      for (const stmt of topLevelStatements) {
        if (stmt.type === 'FunctionDeclaration') {
          functions.push(stmt);
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
      case 'ReturnStatement': return this.visitReturnStatement(stmt);
      case 'ThrowStatement': return this.visitThrowStatement(stmt);
      case 'ExportNamedDeclaration': return stmt.declaration ? this.visitStatement(stmt.declaration) : '';
      default: return `// Unhandled statement: ${stmt.type}`;
    }
  }

  // Track variables that should be StringBuilder for lambda safety
  private stringBuilderVars: Set<string> = new Set();
  // Track variables that hold JSON parsed objects (for property access rewriting)
  private jsonObjectVars: Set<string> = new Set();

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

      const init = d.init ? ` = ${this.visitExpression(d.init)}` : '';
      return `${typeStr} ${d.id.name}${init};`;
    }).join('\n' + this.indent());
  }

  private visitFunctionDeclaration(decl: AST.FunctionDeclaration, isStatic: boolean = false): string {
    const modifiers = isStatic ? 'public static' : 'public';
    const returnType = decl.returnType ? this.mapType(decl.returnType) : 'void';
    const params = decl.params.map(p => {
      const pType = p.typeAnnotation ? this.mapType(p.typeAnnotation) : 'Object';
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
      str += '\n' + this.indent() + 'else \n';
      this.indentLevel++;
      str += this.indent() + this.visitStatement(ifStmt.alternate);
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

  // Expressions
  private visitExpression(expr: AST.Expression): string {
    switch (expr.type) {
      case 'Literal': {
        // Escape inner double quotes in string literals for Java
        if (typeof expr.value === 'string') {
          const escaped = expr.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          return `"${escaped}"`;
        }
        return expr.raw;
      }
      case 'Identifier': {
        return expr.name;
      }
      case 'BinaryExpression': return `${this.visitExpression(expr.left)} ${expr.operator} ${this.visitExpression(expr.right)}`;
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
        return `${this.visitExpression(expr.left)} ${expr.operator} ${this.visitExpression(expr.right)}`;
      }
      case 'CallExpression': return this.visitCallExpression(expr);
      case 'MemberExpression': {
        // Rewrite default-import member expressions: http.get(...) -> Http.get(...)
        if (expr.object.type === 'Identifier' && this.importAliases.has(expr.object.name)) {
          return `${this.importAliases.get(expr.object.name)}.${expr.property.name}`;
        }
        // Rewrite JS globals: JSON.parse -> Json.parse
        if (expr.object.type === 'Identifier' && GLOBAL_REWRITES[expr.object.name]) {
          return `${GLOBAL_REWRITES[expr.object.name]}.${expr.property.name}`;
        }
        // Rewrite JSON object property access: obj.name -> obj.get("name")
        if (expr.object.type === 'Identifier' && this.jsonObjectVars.has(expr.object.name)) {
          return `${expr.object.name}.get("${expr.property.name}")`;
        }
        return `${this.visitExpression(expr.object)}.${expr.property.name}`;
      }
      case 'ArrowFunctionExpression': return this.visitArrowFunctionExpression(expr);
      case 'NewExpression': return `new ${this.visitExpression(expr.callee)}(${expr.arguments.map(a => this.visitExpression(a)).join(', ')})`;
      default: return `/* Unhandled Expression: ${expr.type} */`;
    }
  }

  private visitArrowFunctionExpression(expr: AST.ArrowFunctionExpression): string {
    const params = expr.params.map(p => p.name).join(', ');
    const bodyStr = expr.body.type === 'BlockStatement'
      ? this.visitBlockStatement(expr.body)
      : this.visitExpression(expr.body);

    // Java lambda format: (param1, param2) -> { body }
    return `(${params}) -> ${bodyStr}`;
  }

  private visitCallExpression(call: AST.CallExpression): string {
    // Check for `console.log` standard mapping
    if (call.callee.type === 'MemberExpression') {
      const calleeStr = this.visitExpression(call.callee);
      if (calleeStr === 'console.log') {
        return `System.out.println(${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
      }
    }

    // Check for named-import direct calls: writeFile(...) -> Fs.writeFile(...)
    if (call.callee.type === 'Identifier' && this.importAliases.has(call.callee.name)) {
      const javaClass = this.importAliases.get(call.callee.name);
      return `${javaClass}.${call.callee.name}(${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
    }

    return `${this.visitExpression(call.callee)}(${call.arguments.map(a => this.visitArgExpression(a)).join(', ')})`;
  }

  // Visit an expression used as a function argument — converts StringBuilder to String via .toString()
  private visitArgExpression(expr: AST.Expression): string {
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
        default: return 'Object';
      }
    } else if (typeNode.type === 'TypeReference') {
      if ((typeNode as AST.TypeReference).typeName.type === 'Identifier') {
        return ((typeNode as AST.TypeReference).typeName as AST.Identifier).name;
      } else {
        // QualifiedName logic
        return 'Object'; // simplified for now
      }
    }
    return 'Object';
  }

  private indent(): string {
    return '  '.repeat(this.indentLevel);
  }
}
