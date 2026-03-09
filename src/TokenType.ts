export enum TokenType {
  // Keywords
  LET = 'LET',
  CONST = 'CONST',
  VAR = 'VAR',
  FUNCTION = 'FUNCTION',
  RETURN = 'RETURN',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  FOR = 'FOR',
  CLASS = 'CLASS',
  NEW = 'NEW',
  THIS = 'THIS',
  NULL = 'NULL',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  TRY = 'TRY',
  CATCH = 'CATCH',
  FINALLY = 'FINALLY',
  SWITCH = 'SWITCH',
  CASE = 'CASE',
  DEFAULT = 'DEFAULT',
  BREAK = 'BREAK',
  OF = 'OF',
  TEMPLATE = 'TEMPLATE',

  // Types
  TYPE_NUMBER = 'TYPE_NUMBER',
  TYPE_STRING = 'TYPE_STRING',
  TYPE_BOOLEAN = 'TYPE_BOOLEAN',
  TYPE_VOID = 'TYPE_VOID',
  TYPE_ANY = 'TYPE_ANY',

  // TypeScript specific
  TYPE = 'TYPE',
  INTERFACE = 'INTERFACE',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',

  // Identifiers
  IDENTIFIER = 'IDENTIFIER',

  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  EQUALS = 'EQUALS',
  EQ_EQ = 'EQ_EQ', // ==
  EQ_EQ_EQ = 'EQ_EQ_EQ', // ===
  BANG = 'BANG',
  BANG_EQ = 'BANG_EQ', // !=
  BANG_EQ_EQ = 'BANG_EQ_EQ', // !==
  LESS = 'LESS',
  LESS_EQ = 'LESS_EQ',
  GREATER = 'GREATER',
  GREATER_EQ = 'GREATER_EQ',
  ARROW = 'ARROW', // =>
  PIPE = 'PIPE', // |
  PIPE_PIPE = 'PIPE_PIPE', // ||
  AMPERSAND = 'AMPERSAND', // &
  AMP_AMP = 'AMP_AMP', // &&
  QUESTION = 'QUESTION', // ?
  PLUS_EQ = 'PLUS_EQ', // +=
  MINUS_EQ = 'MINUS_EQ', // -=
  STAR_EQ = 'STAR_EQ', // *=
  SLASH_EQ = 'SLASH_EQ', // /=

  // Punctuation
  L_PAREN = 'L_PAREN', // (
  R_PAREN = 'R_PAREN', // )
  L_BRACE = 'L_BRACE', // {
  R_BRACE = 'R_BRACE', // }
  L_BRACKET = 'L_BRACKET', // [
  R_BRACKET = 'R_BRACKET', // ]
  COMMA = 'COMMA',
  DOT = 'DOT',
  ELLIPSIS = 'ELLIPSIS', // ...
  SEMICOLON = 'SEMICOLON',
  COLON = 'COLON',

  // Special
  EOF = 'EOF',
}
