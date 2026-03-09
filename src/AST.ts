export type NodeType =
  | 'Program'
  | 'VariableDeclaration'
  | 'VariableDeclarator'
  | 'FunctionDeclaration'
  | 'ClassDeclaration'
  | 'ClassBody'
  | 'PropertyDefinition'
  | 'MethodDefinition'
  | 'BlockStatement'
  | 'ExpressionStatement'
  | 'IfStatement'
  | 'ForStatement'
  | 'ForOfStatement'
  | 'WhileStatement'
  | 'ReturnStatement'
  | 'ThrowStatement'
  | 'TryStatement'
  | 'CatchClause'
  | 'SwitchStatement'
  | 'SwitchCase'
  | 'BreakStatement'
  | 'InterfaceDeclaration'
  | 'InterfaceBody'
  | 'PropertySignature'
  | 'TemplateLiteral'
  | 'ImportDeclaration'
  | 'ImportDefaultSpecifier'
  | 'ImportSpecifier'
  | 'ExportNamedDeclaration'
  | 'ExportSpecifier'
  | 'ArrowFunctionExpression'
  | 'BinaryExpression'
  | 'AssignmentExpression'
  | 'CallExpression'
  | 'MemberExpression'
  | 'NewExpression'
  | 'ArrayExpression'
  | 'Identifier'
  | 'Literal'
  | 'UnaryExpression'
  | 'TypeAnnotation'
  | 'TypeReference'
  | 'UnionType'
  | 'KeywordType'
  | 'ArrayType'
  | 'QualifiedName'
  | 'JavaPackageSource';

export interface Node {
  type: NodeType;
  line?: number;
  column?: number;
}

export interface Program extends Node {
  type: 'Program';
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | ClassDeclaration
  | BlockStatement
  | ExpressionStatement
  | IfStatement
  | ForStatement
  | ForOfStatement
  | WhileStatement
  | ReturnStatement
  | ThrowStatement
  | TryStatement
  | SwitchStatement
  | BreakStatement
  | InterfaceDeclaration
  | ImportDeclaration
  | ExportNamedDeclaration;

export type Expression =
  | ArrowFunctionExpression
  | BinaryExpression
  | AssignmentExpression
  | CallExpression
  | MemberExpression
  | NewExpression
  | ArrayExpression
  | Identifier
  | Literal
  | TemplateLiteral
  | UnaryExpression;

export interface VariableDeclaration extends Node {
  type: 'VariableDeclaration';
  kind: 'let' | 'const' | 'var';
  declarations: VariableDeclarator[];
}

export interface VariableDeclarator extends Node {
  type: 'VariableDeclarator';
  id: Identifier;
  typeAnnotation?: TypeNode;
  init?: Expression;
}

export interface FunctionDeclaration extends Node {
  type: 'FunctionDeclaration';
  id: Identifier | null;
  params: Parameter[];
  returnType?: TypeNode;
  body: BlockStatement;
}

export interface Parameter extends Node {
  type: 'Identifier';
  name: string;
  typeAnnotation?: TypeNode;
}

export interface ClassDeclaration extends Node {
  type: 'ClassDeclaration';
  id: Identifier;
  superClass?: Identifier;
  body: ClassBody;
}

export interface ClassBody extends Node {
  type: 'ClassBody';
  body: ClassElement[];
}

export type ClassElement = PropertyDefinition | MethodDefinition;

export interface PropertyDefinition extends Node {
  type: 'PropertyDefinition';
  key: Identifier;
  typeAnnotation?: TypeNode;
  value?: Expression;
}

export interface MethodDefinition extends Node {
  type: 'MethodDefinition';
  key: Identifier;
  kind: 'constructor' | 'method';
  params: Parameter[];
  returnType?: TypeNode;
  body: BlockStatement;
}

export interface BlockStatement extends Node {
  type: 'BlockStatement';
  body: Statement[];
}

export interface ExpressionStatement extends Node {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface IfStatement extends Node {
  type: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate?: Statement;
}

export interface ReturnStatement extends Node {
  type: 'ReturnStatement';
  argument?: Expression;
}

export interface ThrowStatement extends Node {
  type: 'ThrowStatement';
  argument: Expression;
}

export interface TryStatement extends Node {
  type: 'TryStatement';
  block: BlockStatement;
  handler: CatchClause | null;
  finalizer: BlockStatement | null;
}

export interface CatchClause extends Node {
  type: 'CatchClause';
  param: Identifier | null;
  paramType?: TypeNode;
  body: BlockStatement;
}

export interface SwitchStatement extends Node {
  type: 'SwitchStatement';
  discriminant: Expression;
  cases: SwitchCase[];
}

export interface SwitchCase extends Node {
  type: 'SwitchCase';
  test: Expression | null;
  consequent: Statement[];
}

export interface BreakStatement extends Node {
  type: 'BreakStatement';
}

export interface ForStatement extends Node {
  type: 'ForStatement';
  init?: VariableDeclaration | ExpressionStatement;
  test?: Expression;
  update?: Expression;
  body: Statement;
}

export interface ForOfStatement extends Node {
  type: 'ForOfStatement';
  left: VariableDeclaration;
  right: Expression;
  body: Statement;
}

export interface InterfaceDeclaration extends Node {
  type: 'InterfaceDeclaration';
  id: Identifier;
  body: InterfaceBody;
}

export interface InterfaceBody extends Node {
  type: 'InterfaceBody';
  properties: PropertySignature[];
}

export interface PropertySignature extends Node {
  type: 'PropertySignature';
  key: Identifier;
  typeAnnotation: TypeNode;
}

export interface TemplateLiteral extends Node {
  type: 'TemplateLiteral';
  value: string;
}

export interface WhileStatement extends Node {
  type: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface ImportDeclaration extends Node {
  type: 'ImportDeclaration';
  specifiers: (ImportDefaultSpecifier | ImportSpecifier)[];
  source: Literal | JavaPackageSource;
}

export interface JavaPackageSource extends Node {
  type: 'JavaPackageSource';
  path: string[];
  wildcard: boolean;
}

export interface ImportDefaultSpecifier extends Node {
  type: 'ImportDefaultSpecifier';
  local: Identifier;
}

export interface ImportSpecifier extends Node {
  type: 'ImportSpecifier';
  imported: Identifier;
  local: Identifier;
}

export interface ExportNamedDeclaration extends Node {
  type: 'ExportNamedDeclaration';
  declaration?: VariableDeclaration | FunctionDeclaration | ClassDeclaration;
  specifiers?: ExportSpecifier[];
}

export interface ExportSpecifier extends Node {
  type: 'ExportSpecifier';
  local: Identifier;
  exported: Identifier;
}

export interface ArrowFunctionExpression extends Node {
  type: 'ArrowFunctionExpression';
  params: Parameter[];
  returnType?: TypeNode;
  body: BlockStatement | Expression;
}

export interface UnaryExpression extends Node {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
  prefix: boolean;
}

export interface BinaryExpression extends Node {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface AssignmentExpression extends Node {
  type: 'AssignmentExpression';
  operator: string;
  left: Identifier | MemberExpression;
  right: Expression;
}

export interface CallExpression extends Node {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface NewExpression extends Node {
  type: 'NewExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface ArrayExpression extends Node {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface MemberExpression extends Node {
  type: 'MemberExpression';
  object: Expression;
  property: Identifier;
  computed: boolean; // false for dot notation, true for bracket notation []
}

export interface Identifier extends Node {
  type: 'Identifier';
  name: string;
  typeAnnotation?: TypeNode;
}

export interface Literal extends Node {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

// Type Node interfaces

export type TypeNode = TypeReference | UnionType | KeywordType | ArrayType;

export interface ArrayType extends Node {
  type: 'ArrayType';
  elementType: TypeNode;
}

export interface TypeReference extends Node {
  type: 'TypeReference';
  typeName: Identifier | QualifiedName;
}

export interface QualifiedName extends Node {
  type: 'QualifiedName';
  left: Identifier | QualifiedName;
  right: Identifier;
}

export interface UnionType extends Node {
  type: 'UnionType';
  types: TypeNode[]; // e.g. Buffer | string
}

export interface KeywordType extends Node {
  type: 'KeywordType';
  name: 'number' | 'string' | 'boolean' | 'void' | 'any' | 'null';
}
