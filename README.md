# JAVAscript — TypeScript to Java Transpiler

A transpiler that converts TypeScript code into equivalent Java source code and compiles it to JVM bytecode. Write in TypeScript, run on the JVM.

## How It Works

```
TypeScript Source → Tokenizer → Parser → AST → Code Generator → Java Source → javac → .class
```

1. **Tokenization** — Converts source code into tokens (keywords, literals, operators, etc.)
2. **Parsing** — Builds an Abstract Syntax Tree via recursive descent
3. **Code Generation** — Traverses the AST and emits valid Java code
4. **Compilation** — Compiles the generated `.java` files with `javac`

## Quick Start

```bash
bun install          # Install deps + download Java libs (Jackson)
bun run start        # Transpile all examples → .java-output/
bun run java:test    # Compile & run all Java outputs
```

## What's Supported

### Language Features

| Feature           | TypeScript                                      | Generated Java                                      |
| ----------------- | ----------------------------------------------- | --------------------------------------------------- |
| Variables         | `let x: number = 10`                            | `double x = 10;`                                    |
| Constants         | `const y: string = "hi"`                        | `String y = "hi";`                                  |
| Functions         | `function sum(a: number, b: number): number`    | `public static double sum(double a, double b)`      |
| Classes           | `class Person { name: string }`                 | `class Person { public String name; }`              |
| If/Else           | `if (x === '/all') {} else if (...) {} else {}` | `if ("/all".equals(x)) {} else if (...) {} else {}` |
| Arrow Functions   | `(x) => { ... }`                                | `(x) -> { ... }` (Java lambdas)                     |
| String Comparison | `x === 'foo'`                                   | `"foo".equals(x)`                                   |
| Truthiness        | `if (user)`                                     | `if (user != null)`                                 |
| Console           | `console.log(x)`                                | `System.out.println(x)`                             |
| Imports           | `import http from 'http'`                       | Mapped to Java wrappers                             |
| Java Imports      | `import X from 'com.pkg.Class'`                 | `import com.pkg.Class;`                             |
| Exports           | `export function`, `export class`               | Public class members                                |

### Module Mapping

TypeScript `fs` and `http` modules are mapped to Java wrapper libraries in `.java-integration-libs/`:

| Node.js                      | Java Wrapper                 | Wraps                            |
| ---------------------------- | ---------------------------- | -------------------------------- |
| `fs.readFileSync()`          | `Fs.readFileSync()`          | `java.nio.file.Files`            |
| `fs.writeFileSync()`         | `Fs.writeFileSync()`         | `java.nio.file.Files`            |
| `fs.writeFile(cb)`           | `Fs.writeFile(cb)`           | `java.nio.file.Files` + callback |
| `http.get(url, cb)`          | `Http.get(url, cb)`          | `java.net.http.HttpClient`       |
| `http.createServer(handler)` | `Http.createServer(handler)` | `com.sun.net.httpserver`         |
| `JSON.parse(text)`           | `Json.parse(text)`           | Jackson `ObjectMapper`           |
| `JSON.parseArray(text)`      | `Json.parseArray(text)`      | Jackson `ArrayNode`              |
| `JSON.stringify(obj)`        | `Json.stringify(obj)`        | Jackson `ObjectMapper`           |

### Code Generation Features

- **String escaping** — `{"name":"Alice"}` → `"{\"name\":\"Alice\"}"`
- **StringBuilder** — `let` string vars become `StringBuilder` for lambda-safe mutation
- **Method references** — Bare function refs become `ClassName::method`
- **HTTP handler typing** — `(req: any, res: any)` → `(Http.ServerRequest req, Http.ServerResponse res)`
- **JSON object access** — `obj.name` → `obj.get("name")`, `obj.name = x` → `obj.set("name", x)`
- **Integer literals** — `3000` stays `3000`, not `3000.0`

## Examples

| #   | File                    | Tests                                   | Status |
| --- | ----------------------- | --------------------------------------- | ------ |
| 01  | `01-main-function.ts`   | Variables, if/else, console.log         | ✅     |
| 02  | `02-sum.ts`             | Functions, return values                | ✅     |
| 03  | `03-imports.ts`         | HTTP GET, file write, callbacks         | ✅     |
| 04  | `04-exports.ts`         | Classes, exports                        | ✅     |
| 05  | `05-java-imports.ts`    | Java package imports (`java.lang.Math`) | ✅     |
| 06  | `06-json-and-files.ts`  | JSON.parse, JSON.stringify, file I/O    | ✅     |
| 07  | `07-http-server.ts`     | HTTP server, createServer, listen       | ✅     |
| 08  | `08-read-write-file.ts` | readFileSync, writeFileSync             | ✅     |
| 09  | `09-http-server-api.ts` | REST API with routing & query params    | ✅     |

## Project Structure

```
├── src/
│   ├── index.ts           # Entry point — orchestrates the pipeline
│   ├── Tokenizer.ts       # Lexical analysis
│   ├── Token.ts           # Token class
│   ├── TokenType.ts       # Token type enum
│   ├── Parser.ts          # Recursive descent parser
│   ├── AST.ts             # AST node type definitions
│   └── CodeGenerator.ts   # AST → Java code emitter
├── examples/              # TypeScript source files for testing
├── examples-output/       # Tokenizer/parser output logs
├── .java-output/          # Generated .java and .class files
├── .java-integration-libs/
│   ├── Fs.java            # java.nio.file wrapper
│   ├── Http.java          # java.net.http + com.sun.net.httpserver wrapper
│   ├── Json.java          # Jackson wrapper (JSON.parse/stringify)
│   └── lib/               # Jackson JARs (downloaded via postinstall)
├── scripts/
│   └── setup-java-deps.sh # Downloads Jackson JARs from Maven Central
└── run-java-tests.sh      # Compiles & runs all Java outputs
```

## Dependencies

- **Runtime**: [Bun](https://bun.sh/) (TypeScript execution)
- **Compilation**: JDK 11+ (`javac` / `java`)
- **Java libs**: [Jackson](https://github.com/FasterXML/jackson) 2.18.x (auto-downloaded via `bun install`)
