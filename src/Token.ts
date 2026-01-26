import { TokenType } from './TokenType';

export class Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;

  constructor(type: TokenType, value: string, line: number, column: number) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString(): string {
    return `Token(${this.type}, "${this.value}", line=${this.line}, col=${this.column})`;
  }
}
