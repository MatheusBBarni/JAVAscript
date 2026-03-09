function main(): void {
  const x: number = 10;
  const neg: number = -x;
  console.log("neg:");
  console.log(neg);

  const y: boolean = true;
  const z: boolean = false;

  console.log("!y:");
  console.log(!y);

  if (y && !z) {
    console.log('Both true');
  }

  if (y || z) {
    console.log('At least one is true');
  }

  if (!y || z) {
    console.log('Never happens');
  } else {
    console.log('Expected else');
  }
}

main();
