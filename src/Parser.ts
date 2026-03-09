import { Token } from './Token';
import { TokenType } from './TokenType';
import * as AST from './AST';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.Program {
    const statements: AST.Statement[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return { type: 'Program', body: statements, line: 1, column: 1 };
  }

  private declaration(): AST.Statement {
    if (this.match(TokenType.IMPORT)) return this.importDeclaration();
    if (this.match(TokenType.EXPORT)) return this.exportDeclaration();
    if (this.match(TokenType.CLASS)) return this.classDeclaration();
    if (this.match(TokenType.FUNCTION)) return this.functionDeclaration();
    if (this.match(TokenType.LET, TokenType.CONST, TokenType.VAR)) {
      return this.variableDeclaration(this.previous().value as 'let' | 'const' | 'var');
    }

    return this.statement();
  }

  private statement(): AST.Statement {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.L_BRACE)) return this.blockStatement(true);

    // Check for 'throw' mapped as Identifier
    if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'throw') {
      this.advance();
      return this.throwStatement();
    }

    return this.expressionStatement();
  }

  private importDeclaration(): AST.ImportDeclaration {
    const startToken = this.previous();
    const specifiers: (AST.ImportDefaultSpecifier | AST.ImportSpecifier)[] = [];

    // import http from 'http';
    // import { writeFile } from 'fs';
    if (this.match(TokenType.L_BRACE)) {
      do {
        if (this.check(TokenType.R_BRACE)) break;
        const name = this.consume(TokenType.IDENTIFIER, "Expect imported name.").value;
        specifiers.push({
          type: 'ImportSpecifier',
          imported: { type: 'Identifier', name },
          local: { type: 'Identifier', name },
        });
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.R_BRACE, "Expect '}' after import specifiers.");
    } else {
      const name = this.consume(TokenType.IDENTIFIER, "Expect default import name.").value;
      specifiers.push({
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name }
      });
    }

    this.consume(TokenType.FROM, "Expect 'from' after import specifiers.");
    const sourceTk = this.consume(TokenType.STRING, "Expect import source.");

    // Optional semicolon
    this.match(TokenType.SEMICOLON);

    let sourceNode: AST.Literal | AST.JavaPackageSource;

    // Check if the string matches a java-like package path (e.g. com.digibee.*)
    // Needs to have at least one dot to be considered a package path in this context.
    const pathValue = sourceTk.value;
    if (pathValue.includes('.') && /^[a-zA-Z0-9_*.]+$/.test(pathValue)) {
      const parts = pathValue.split('.');
      const wildcard = parts[parts.length - 1] === '*';
      if (wildcard) {
        parts.pop(); // Remove the '*' from the path array
      }
      sourceNode = {
        type: 'JavaPackageSource',
        path: parts,
        wildcard,
        line: sourceTk.line, column: sourceTk.column
      };
    } else {
      sourceNode = { type: 'Literal', value: pathValue, raw: `"${pathValue}"`, line: sourceTk.line, column: sourceTk.column };
    }

    return {
      type: 'ImportDeclaration',
      specifiers,
      source: sourceNode,
      line: startToken.line, column: startToken.column
    };
  }

  private exportDeclaration(): AST.Statement {
    const startToken = this.previous();

    if (this.match(TokenType.CONST, TokenType.LET, TokenType.VAR)) {
      const decl = this.variableDeclaration(this.previous().value as 'let' | 'const' | 'var');
      return { type: 'ExportNamedDeclaration', declaration: decl, line: startToken.line, column: startToken.column };
    }
    if (this.match(TokenType.FUNCTION)) {
      const decl = this.functionDeclaration();
      return { type: 'ExportNamedDeclaration', declaration: decl, line: startToken.line, column: startToken.column };
    }
    if (this.match(TokenType.CLASS)) {
      const decl = this.classDeclaration();
      return { type: 'ExportNamedDeclaration', declaration: decl, line: startToken.line, column: startToken.column };
    }
    if (this.match(TokenType.L_BRACE)) {
      const specifiers: AST.ExportSpecifier[] = [];
      do {
        if (this.check(TokenType.R_BRACE)) break;
        const name = this.consume(TokenType.IDENTIFIER, "Expect export name.").value;
        specifiers.push({
          type: 'ExportSpecifier',
          local: { type: 'Identifier', name },
          exported: { type: 'Identifier', name }
        });
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.R_BRACE, "Expect '}' after export specifiers.");
      this.consume(TokenType.SEMICOLON, "Expect ';' after export declaration.");
      return { type: 'ExportNamedDeclaration', specifiers, line: startToken.line, column: startToken.column };
    }

    throw this.error(this.peek(), "Unsupported export declaration.");
  }

  private classDeclaration(): AST.ClassDeclaration {
    const startToken = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.").value;

    this.consume(TokenType.L_BRACE, "Expect '{' before class body.");
    const body: AST.ClassElement[] = [];
    while (!this.check(TokenType.R_BRACE) && !this.isAtEnd()) {
      const isConstructor = this.check(TokenType.IDENTIFIER) && this.peek().value === 'constructor';
      const propName = this.consume(TokenType.IDENTIFIER, "Expect property or method name.").value;

      if (this.match(TokenType.L_PAREN)) {
        // Method
        const params = this.parameters();
        let returnType: AST.TypeNode | undefined;
        if (this.match(TokenType.COLON)) {
          returnType = this.typeAnnotation();
        }
        this.consume(TokenType.L_BRACE, "Expect '{' before method body.");
        body.push({
          type: 'MethodDefinition',
          key: { type: 'Identifier', name: propName },
          kind: isConstructor ? 'constructor' : 'method',
          params,
          returnType,
          body: this.blockStatement(true)
        });
      } else {
        // Property
        let typeAnnotation: AST.TypeNode | undefined;
        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.typeAnnotation();
        }
        let value: AST.Expression | undefined;
        if (this.match(TokenType.EQUALS)) {
          value = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after property declaration.");
        body.push({
          type: 'PropertyDefinition',
          key: { type: 'Identifier', name: propName },
          typeAnnotation,
          value
        });
      }
    }
    this.consume(TokenType.R_BRACE, "Expect '}' after class body.");

    return {
      type: 'ClassDeclaration',
      id: { type: 'Identifier', name },
      body: { type: 'ClassBody', body },
      line: startToken.line, column: startToken.column
    };
  }

  private functionDeclaration(): AST.FunctionDeclaration {
    const startToken = this.previous();
    const name = this.consume(TokenType.IDENTIFIER, "Expect function name.").value;
    this.consume(TokenType.L_PAREN, "Expect '(' after function name.");
    const params = this.parameters();

    let returnType: AST.TypeNode | undefined;
    if (this.match(TokenType.COLON)) {
      returnType = this.typeAnnotation();
    }

    this.consume(TokenType.L_BRACE, "Expect '{' before function body.");
    const body = this.blockStatement(true);

    return {
      type: 'FunctionDeclaration',
      id: { type: 'Identifier', name },
      params,
      returnType,
      body,
      line: startToken.line, column: startToken.column
    };
  }

  private variableDeclaration(kind: 'let' | 'const' | 'var'): AST.VariableDeclaration {
    const startToken = this.previous();
    const declarations: AST.VariableDeclarator[] = [];

    do {
      const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.").value;
      let typeAnnotation: AST.TypeNode | undefined;
      if (this.match(TokenType.COLON)) {
        typeAnnotation = this.typeAnnotation();
      }

      let init: AST.Expression | undefined;
      if (this.match(TokenType.EQUALS)) {
        init = this.expression();
      }
      declarations.push({
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name },
        typeAnnotation,
        init
      });
    } while (this.match(TokenType.COMMA));

    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

    return { type: 'VariableDeclaration', kind, declarations, line: startToken.line, column: startToken.column };
  }

  private ifStatement(): AST.IfStatement {
    const startToken = this.previous();
    this.consume(TokenType.L_PAREN, "Expect '(' after 'if'.");
    const test = this.expression();
    this.consume(TokenType.R_PAREN, "Expect ')' after if condition.");

    const consequent = this.statement();
    let alternate: AST.Statement | undefined;
    if (this.match(TokenType.ELSE)) {
      alternate = this.statement();
    }

    return { type: 'IfStatement', test, consequent, alternate, line: startToken.line, column: startToken.column };
  }

  private returnStatement(): AST.ReturnStatement {
    const startToken = this.previous();
    let value: AST.Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
    return { type: 'ReturnStatement', argument: value, line: startToken.line, column: startToken.column };
  }

  private throwStatement(): AST.ThrowStatement {
    const startToken = this.previous();
    const argument = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after throw expression.");
    return { type: 'ThrowStatement', argument, line: startToken.line, column: startToken.column };
  }

  private blockStatement(lBraceConsumed = false): AST.BlockStatement {
    const startToken = this.previous();
    if (!lBraceConsumed) {
      this.consume(TokenType.L_BRACE, "Expect '{' before block.");
    }

    const statements: AST.Statement[] = [];
    while (!this.check(TokenType.R_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.R_BRACE, "Expect '}' after block.");
    return { type: 'BlockStatement', body: statements, line: startToken.line, column: startToken.column };
  }

  private expressionStatement(): AST.ExpressionStatement {
    const startToken = this.peek();
    const expr = this.expression();
    if (this.match(TokenType.SEMICOLON)) {
      // optional or required depends on language, usually required in rigid parsing
    }
    return { type: 'ExpressionStatement', expression: expr, line: startToken.line, column: startToken.column };
  }

  // --- Expressions ---

  private expression(): AST.Expression {
    return this.assignment();
  }

  private assignment(): AST.Expression {
    const expr = this.logicalOr();

    if (this.match(TokenType.EQUALS, TokenType.PLUS_EQ, TokenType.MINUS_EQ, TokenType.STAR_EQ, TokenType.SLASH_EQ)) {
      return this.finishAssignment(expr);
    }
    return expr;
  }

  private finishAssignment(expr: AST.Expression): AST.Expression {
    const equalsToken = this.previous();
    if (equalsToken.type === TokenType.EQUALS || equalsToken.type === TokenType.PLUS_EQ || equalsToken.type === TokenType.MINUS_EQ || equalsToken.type === TokenType.STAR_EQ || equalsToken.type === TokenType.SLASH_EQ) {
      const value = this.assignment();
      if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
        return { type: 'AssignmentExpression', operator: equalsToken.value, left: expr, right: value, line: expr.line, column: expr.column };
      }
      throw this.error(equalsToken, "Invalid assignment target.");
    }
    return expr;
  }

  private logicalOr(): AST.Expression {
    let expr = this.logicalAnd();
    while (this.match(TokenType.PIPE)) { // simplified OR
      if (this.previous().value === '||') { // actually we tokenizer | pipe, we didn't add ||
        // If tokenizer yields PIPE PIPE, we could combine, but we skip bitwise vs logical distinction for now
      }
    }
    return expr;
  }

  private logicalAnd(): AST.Expression {
    let expr = this.equality();
    return expr;
  }

  private equality(): AST.Expression {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQ, TokenType.BANG_EQ_EQ, TokenType.EQ_EQ, TokenType.EQ_EQ_EQ)) {
      const operator = this.previous().value;
      const right = this.comparison();
      expr = { type: 'BinaryExpression', operator, left: expr, right, line: expr.line, column: expr.column };
    }

    return expr;
  }

  private comparison(): AST.Expression {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQ, TokenType.LESS, TokenType.LESS_EQ)) {
      const operator = this.previous().value;
      const right = this.term();
      expr = { type: 'BinaryExpression', operator, left: expr, right, line: expr.line, column: expr.column };
    }

    return expr;
  }

  private term(): AST.Expression {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      expr = { type: 'BinaryExpression', operator, left: expr, right, line: expr.line, column: expr.column };
    }

    return expr;
  }

  private factor(): AST.Expression {
    let expr = this.call();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous().value;
      const right = this.call();
      expr = { type: 'BinaryExpression', operator, left: expr, right, line: expr.line, column: expr.column };
    }

    return expr;
  }

  private call(): AST.Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.L_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.").value;
        expr = { type: 'MemberExpression', object: expr, property: { type: 'Identifier', name }, computed: false, line: expr.line, column: expr.column };
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: AST.Expression): AST.CallExpression {
    const args: AST.Expression[] = [];
    if (!this.check(TokenType.R_PAREN)) {
      do {
        // Arrow function argument hack for example 03
        if (this.check(TokenType.L_PAREN) || this.check(TokenType.IDENTIFIER)) {
          // we should technically have a nice lookahead to see if it's an arrow func.
          // Let's implement parseArrowFunction if there's an arrow
          let isArrow = false;
          let current = this.current;
          if (this.tokens[current] && this.tokens[current].type === TokenType.L_PAREN) {
            while (this.tokens[current] && this.tokens[current].type !== TokenType.R_PAREN) current++;
            current++; // skip R_PAREN
            if (this.tokens[current] && this.tokens[current].type === TokenType.COLON) {
              while (this.tokens[current] && this.tokens[current].type !== TokenType.L_BRACE && this.tokens[current].type !== TokenType.ARROW) current++;
            }
            if (this.tokens[current] && this.tokens[current].type === TokenType.ARROW) isArrow = true;
          } else if (this.tokens[current] && this.tokens[current].type === TokenType.IDENTIFIER && this.tokens[current + 1] && this.tokens[current + 1].type === TokenType.ARROW) {
            isArrow = true;
          }

          if (isArrow) {
            args.push(this.arrowFunction());
            continue;
          }
        }
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.R_PAREN, "Expect ')' after arguments.");
    return { type: 'CallExpression', callee, arguments: args, line: callee.line, column: callee.column };
  }

  private arrowFunction(): AST.Expression {
    const line = this.peek().line;
    const col = this.peek().column;
    const params: AST.Parameter[] = [];
    if (this.match(TokenType.L_PAREN)) {
      if (!this.check(TokenType.R_PAREN)) {
        params.push(...this.parameters());
      } else {
        this.consume(TokenType.R_PAREN, "Expect ')' list");
      }
    } else {
      const name = this.consume(TokenType.IDENTIFIER, "Expect param name.").value;
      params.push({ type: 'Identifier', name });
    }

    let returnType: AST.TypeNode | undefined;
    if (this.match(TokenType.COLON)) {
      returnType = this.typeAnnotation();
    }

    this.consume(TokenType.ARROW, "Expect '=>' for arrow function.");
    let body: AST.BlockStatement | AST.Expression;
    if (this.match(TokenType.L_BRACE)) {
      body = this.blockStatement(true);
    } else {
      body = this.expression();
    }

    return { type: 'ArrowFunctionExpression', params, returnType, body, line, column: col };
  }

  private primary(): AST.Expression {
    // True/False/Null
    if (this.match(TokenType.FALSE)) return { type: 'Literal', value: false, raw: "false", line: this.previous().line, column: this.previous().column };
    if (this.match(TokenType.TRUE)) return { type: 'Literal', value: true, raw: "true", line: this.previous().line, column: this.previous().column };
    if (this.match(TokenType.NULL)) return { type: 'Literal', value: null, raw: "null", line: this.previous().line, column: this.previous().column };

    if (this.match(TokenType.THIS)) return { type: 'Identifier', name: "this", line: this.previous().line, column: this.previous().column };

    // Number/String
    if (this.match(TokenType.NUMBER)) {
      const val = parseFloat(this.previous().value);
      return { type: 'Literal', value: val, raw: this.previous().value, line: this.previous().line, column: this.previous().column };
    }
    if (this.match(TokenType.STRING)) {
      const val = this.previous().value;
      return { type: 'Literal', value: val, raw: `"${val}"`, line: this.previous().line, column: this.previous().column };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { type: 'Identifier', name: this.previous().value, line: this.previous().line, column: this.previous().column };
    }

    if (this.match(TokenType.L_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.R_PAREN, "Expect ')' after expression.");
      return expr;
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  // --- Types & Parameters ---

  private parameters(): AST.Parameter[] {
    const params: AST.Parameter[] = [];
    if (!this.check(TokenType.R_PAREN)) {
      do {
        const name = this.consume(TokenType.IDENTIFIER, "Expect parameter name.").value;
        let typeAnnotation: AST.TypeNode | undefined;
        if (this.match(TokenType.COLON)) {
          typeAnnotation = this.typeAnnotation();
        }
        params.push({ type: 'Identifier', name, typeAnnotation });
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.R_PAREN, "Expect ')' after parameters.");
    return params;
  }

  private typeAnnotation(): AST.TypeNode {
    let types: AST.TypeNode[] = [];

    do {
      if (this.match(TokenType.PIPE)) {
        // just ignore pipe if it was consumed above. Actually our loop does it better.
      }

      const typeStart = this.peek();

      if (this.match(TokenType.TYPE_NUMBER, TokenType.TYPE_STRING, TokenType.TYPE_BOOLEAN, TokenType.TYPE_VOID, TokenType.TYPE_ANY, TokenType.NULL)) {
        types.push({ type: 'KeywordType', name: this.previous().value as any, line: typeStart.line, column: typeStart.column });
      } else {
        const name = this.consume(TokenType.IDENTIFIER, "Expect type name.").value;
        let typeName: AST.Identifier | AST.QualifiedName = { type: 'Identifier', name, line: typeStart.line, column: typeStart.column };

        while (this.match(TokenType.DOT)) {
          const prop = this.consume(TokenType.IDENTIFIER, "Expect property name in qualified type.").value;
          typeName = {
            type: 'QualifiedName',
            left: typeName,
            right: { type: 'Identifier', name: prop, line: this.previous().line, column: this.previous().column },
            line: typeName.line, column: typeName.column
          };
        }
        types.push({ type: 'TypeReference', typeName, line: typeStart.line, column: typeStart.column });
      }
    } while (this.match(TokenType.PIPE));

    if (types.length === 1) return types[0] as AST.TypeNode;
    const firstType = types[0] as AST.TypeNode;
    return { type: 'UnionType', types, line: firstType.line, column: firstType.column };
  }

  // --- Utility ---

  private peek(): Token {
    return this.tokens[this.current] || this.tokens[this.tokens.length - 1] as Token;
  }

  private previous(): Token {
    return this.tokens[this.current - 1] || this.tokens[0] as Token;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    return new Error(`[line ${token.line}:${token.column}] Error at '${token.value}': ${message}`);
  }
}
