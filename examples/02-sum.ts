function sum(a: number, b: number): number {
  return a + b;
}

function main(): void {
  const x: number = 10;
  const y: number = 20;
  const z: number = sum(x, y);
  console.log(z);
}

main();
