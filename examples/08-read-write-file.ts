import { readFileSync, writeFileSync } from 'fs';

function main(): void {
  const text: string = 'Hello from JAVAscript!';
  writeFileSync('test-output.txt', text);
  console.log('File written successfully');

  const content: string = readFileSync('test-output.txt', 'utf-8');
  console.log(content);

  const lines: string = 'line1\nline2\nline3';
  writeFileSync('multiline.txt', lines);
  console.log('Multiline file written');

  const read: string = readFileSync('multiline.txt', 'utf-8');
  console.log(read);
}

main();
