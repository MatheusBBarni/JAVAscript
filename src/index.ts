import { Tokenizer } from './Tokenizer';
import { Parser } from './Parser';
import { CodeGenerator } from './CodeGenerator';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { join } from 'path';

const examplesDir = join(process.cwd(), 'examples');
const outputDir = join(process.cwd(), 'examples-output');
const javaOutputDir = join(process.cwd(), '.java-output');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
}
if (!existsSync(javaOutputDir)) {
  mkdirSync(javaOutputDir);
}

try {
  const files = readdirSync(examplesDir);

  files.forEach(file => {
    if (!file.endsWith('.ts')) return;

    const filePath = join(examplesDir, file);
    const code = readFileSync(filePath, 'utf-8');

    console.log(`Processing ${file}...`);

    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();

    let output = `Source: ${file}\n\nTokens:\n`;
    tokens.forEach(token => output += token.toString() + "\n");

    let javaOutput = "";
    try {
      const parser = new Parser(tokens);
      const ast = parser.parse();
      output += `\n\nAST:\n`;
      output += JSON.stringify(ast, null, 2);

      // Java class names can't start with numbers. Let's prepend "Test" if it starts with a number.
      let fileNameWithoutExt = file.replace('.ts', '').replace(/-/g, '_');
      if (/^[0-9]/.test(fileNameWithoutExt)) {
        fileNameWithoutExt = "Test_" + fileNameWithoutExt;
      }
      const className = fileNameWithoutExt.charAt(0).toUpperCase() + fileNameWithoutExt.slice(1);

      const generator = new CodeGenerator(className);
      javaOutput = generator.generate(ast);

      const javaFilePath = join(javaOutputDir, `${className}.java`);
      writeFileSync(javaFilePath, javaOutput);
      console.log(`Generated Java Code written to ${javaFilePath}`);

      // Attempt to compile
      exec(`javac -d ${javaOutputDir} ${javaFilePath}`, (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error(`Compilation error for ${className}.java:\n`, stderr);
        } else {
          console.log(`Successfully compiled ${className}.class`);
        }
      });

    } catch (parseError: any) {
      console.error(`Error parsing ${file}: ${parseError.message}`);
      output += `\n\nParse Error:\n${parseError.message}\n`;
    }

    const outputFilePath = join(outputDir, `${file}.txt`);
    writeFileSync(outputFilePath, output);
    console.log(`Outputs written to ${outputFilePath}`);
  });

} catch (error) {
  console.error("Error processing files:", error);
}
