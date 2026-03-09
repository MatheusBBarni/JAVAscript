import { Token } from './Token';
import { TokenType } from './TokenType';

export class Tokenizer {
  private source: string;
  private tokens: Token[] = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private column: number = 1; // Tracks column start of the current token
  private currentLineStart: number = 0; // Index in source where current line starts

  private static keywords: Record<string, TokenType> = {
    'let': TokenType.LET,
    'const': TokenType.CONST,
    'var': TokenType.VAR,
    'function': TokenType.FUNCTION,
    'return': TokenType.RETURN,
    'import': TokenType.IMPORT,
    'export': TokenType.EXPORT,
    'from': TokenType.FROM,
    'if': TokenType.IF,
    'else': TokenType.ELSE,
    'while': TokenType.WHILE,
    'for': TokenType.FOR,
    'class': TokenType.CLASS,
    'new': TokenType.NEW,
    'this': TokenType.THIS,
    'null': TokenType.NULL,
    'true': TokenType.TRUE,
    'false': TokenType.FALSE,
    'try': TokenType.TRY,
    'catch': TokenType.CATCH,
    'finally': TokenType.FINALLY,
    'switch': TokenType.SWITCH,
    'case': TokenType.CASE,
    'default': TokenType.DEFAULT,
    'break': TokenType.BREAK,
    'of': TokenType.OF,

    // Types
    'number': TokenType.TYPE_NUMBER,
    'string': TokenType.TYPE_STRING,
    'boolean': TokenType.TYPE_BOOLEAN,
    'void': TokenType.TYPE_VOID,
    'any': TokenType.TYPE_ANY,

    // TypeScript specific
    'type': TokenType.TYPE,
    'interface': TokenType.INTERFACE,
    'implements': TokenType.IMPLEMENTS,
    'extends': TokenType.EXTENDS,
  };

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", this.line, this.current - this.currentLineStart + 1));
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.L_PAREN); break;
      case ')': this.addToken(TokenType.R_PAREN); break;
      case '{': this.addToken(TokenType.L_BRACE); break;
      case '}': this.addToken(TokenType.R_BRACE); break;
      case '[': this.addToken(TokenType.L_BRACKET); break;
      case ']': this.addToken(TokenType.R_BRACKET); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.':
        if (this.match('.') && this.match('.')) {
          this.addToken(TokenType.ELLIPSIS);
        } else {
          this.addToken(TokenType.DOT);
        }
        break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case ':': this.addToken(TokenType.COLON); break;
      case '*': this.addToken(TokenType.STAR); break;

      case '!':
        if (this.match('=')) {
          this.addToken(this.match('=') ? TokenType.BANG_EQ_EQ : TokenType.BANG_EQ);
        } else {
          this.addToken(TokenType.BANG);
        }
        break;
      case '=':
        if (this.match('=')) {
          this.addToken(this.match('=') ? TokenType.EQ_EQ_EQ : TokenType.EQ_EQ);
        } else if (this.match('>')) {
          this.addToken(TokenType.ARROW);
        } else {
          this.addToken(TokenType.EQUALS);
        }
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQ : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQ : TokenType.GREATER);
        break;
      case '/':
        if (this.match('/')) {
          // Comment goes until the end of the line
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('=')) {
          this.addToken(TokenType.SLASH_EQ);
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case '+':
        if (this.match('=')) {
          this.addToken(TokenType.PLUS_EQ);
        } else {
          this.addToken(TokenType.PLUS);
        }
        break;
      case '-':
        if (this.match('=')) {
          this.addToken(TokenType.MINUS_EQ);
        } else {
          this.addToken(TokenType.MINUS);
        }
        break;
      case '*':
        if (this.match('=')) {
          this.addToken(TokenType.STAR_EQ);
        } else {
          this.addToken(TokenType.STAR);
        }
        break;
      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.PIPE_PIPE);
        } else {
          this.addToken(TokenType.PIPE);
        }
        break;
      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AMP_AMP);
        } else {
          this.addToken(TokenType.AMPERSAND);
        }
        break;
      case '?':
        this.addToken(TokenType.QUESTION);
        break;

      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;

      case '\n':
        this.line++;
        this.currentLineStart = this.current;
        break;

      case '"':
      case "'":
        this.string(c);
        break;

      case '`':
        this.templateString();
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new Error(`Unexpected character: ${c} at line ${this.line}`);
        }
        break;
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let type = Object.prototype.hasOwnProperty.call(Tokenizer.keywords, text) ? Tokenizer.keywords[text] : undefined;
    if (!type) type = TokenType.IDENTIFIER;

    this.addToken(type);
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER, this.source.substring(this.start, this.current));
  }

  private string(quote: string): void {
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.currentLineStart = this.current;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error("Unterminated string.");
    }

    // The closing " or '
    this.advance();

    // Trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private templateString(): void {
    while (this.peek() !== '`' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.currentLineStart = this.current;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated template string at line ${this.line}`);
    }

    this.advance(); // The closing backtick

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.TEMPLATE, value);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current] || '';
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1] || '';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      c === '_';
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source[this.current++] || '';
  }

  private addToken(type: TokenType, literal: string = ""): void {
    const text = this.source.substring(this.start, this.current);
    // column is 1-based index relative to the start of the line
    const col = this.start - this.currentLineStart + 1;
    this.tokens.push(new Token(type, literal || text, this.line, col));
  }
}
