# Typescript to Java Interpreter

This project is a interpreter that translates Typescript code into equivalent Java code. The goal is to allow developers to write in Typescript and run it on the Java Virtual Machine (JVM).

## Project Overview

The interpreter follows the standard compilation including:

1.  **Tokenization (Lexical Analysis)**: Converts raw source code into a stream of tokens.
2.  **Parsing (Syntax Analysis)**: Consumes tokens to build an Abstract Syntax Tree (AST).
3.  **Code Generation**: Traverses the AST and emits valid Java code.

## Current Status

- [x] **Tokenization**: Implemented. Supports keywords, literals, operators, functions, and imports.
- [x] **Parsing**: In progress. Designing AST structure and recursive descent parser.
- [ ] **Code Generation**: WIP.

## Examples

The `examples` directory contains sample Typescript files used for testing.
The `examples-output` directory contains the output of the interpreter process (currently token lists).

### Supported Features (Planned/In-progress)

- Variable declarations (`let`, `const`)
- Function declarations and calls
- `If`/`else`, `while`, `for` loops
- `Import`/`export` syntax
- Basic arithmetic and logical operations

## Running the Project

To run the interpreter (currently tokenizes examples):

```bash
bun run src/index.ts
```
