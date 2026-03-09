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
  | 'ReturnStatement'
  | 'ThrowStatement'
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
  | 'Identifier'
  | 'Literal'
  | 'TypeAnnotation'
  | 'TypeReference'
  | 'UnionType'
  | 'KeywordType'
  | 'QualifiedName';

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
  | ReturnStatement
  | ThrowStatement
  | ImportDeclaration
  | ExportNamedDeclaration;

export type Expression =
  | ArrowFunctionExpression
  | BinaryExpression
  | AssignmentExpression
  | CallExpression
  | MemberExpression
  | NewExpression
  | Identifier
  | Literal;

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

export interface ImportDeclaration extends Node {
  type: 'ImportDeclaration';
  specifiers: (ImportDefaultSpecifier | ImportSpecifier)[];
  source: Literal;
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

export type TypeNode = TypeReference | UnionType | KeywordType;

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
