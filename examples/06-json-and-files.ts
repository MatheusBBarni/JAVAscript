import { readFileSync, writeFileSync } from 'fs';

function main(): void {
  const data: string = '{"name":"Alice","age":30}';

  const obj = JSON.parse(data);
  console.log(obj.name);
  console.log(obj.age);

  obj.name = "Bob";
  obj.age = 25;

  const result: string = JSON.stringify(obj);
  console.log(result);

  writeFileSync('output.json', result);
  console.log('JSON written to output.json');

  const content: string = readFileSync('output.json', 'utf-8');
  console.log(content);
}

main();
