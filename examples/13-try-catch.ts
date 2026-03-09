function riskyFunction(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

function main(): void {
  try {
    console.log(riskyFunction(10, 2));
    console.log(riskyFunction(10, 0));
    console.log("This will not be printed");
  } catch (e: any) {
    console.log("Caught an error");
  } finally {
    console.log("Finally block executed");
  }
}

main();
