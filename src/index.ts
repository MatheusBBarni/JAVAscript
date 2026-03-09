import { Tokenizer } from './Tokenizer';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

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

    const outputFilePath = join(outputDir, `${file}.txt`);
    writeFileSync(outputFilePath, output);
    console.log(`Outputs written to ${outputFilePath}`);
  });

} catch (error) {
  console.error("Error processing files:", error);
}
