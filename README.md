# JavaScript to Java Compiler

This project works on a compiler that translates JavaScript code into equivalent Java code. The goal is to allow developers to write in JavaScript and compile it to run on the Java Virtual Machine (JVM).

## Project Overview

The compiler follows the standard compilation including:
1.  **Tokenization (Lexical Analysis)**: Converts raw source code into a stream of tokens.
2.  **Parsing (Syntax Analysis)**: Consumes tokens to build an Abstract Syntax Tree (AST).
3.  **Code Generation**: Traverses the AST and emits valid Java code.

## Current Status

- [x] **Tokenization**: Implemented. Supports keywords, literals, operators, functions, and imports.
- [ ] **Parsing**: In progress. Designing AST structure and recursive descent parser.
- [ ] **Code Generation**: Planned.

## Examples

The `examples` directory contains sample JavaScript files used for testing.
The `examples-output` directory contains the output of the compilation process (currently token lists).

### Supported Features (Planned/In-progress)
- Variable declarations (`let`, `const`, `var`)
- Function declarations and calls
- `If`/`else`, `while`, `for` loops
- `Import`/`export` syntax
- Basic arithmetic and logical operations

## Running the Project

To run the compiler (currently tokenizes examples):

```bash
bun run src/index.ts
```
