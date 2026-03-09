import { Tokenizer } from './Tokenizer';
import { Parser } from './Parser';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const examplesDir = join(process.cwd(), 'examples');
const outputDir = join(process.cwd(), 'examples-output');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir);
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

    try {
      const parser = new Parser(tokens);
      const ast = parser.parse();
      output += `\n\nAST:\n`;
      output += JSON.stringify(ast, null, 2);
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
