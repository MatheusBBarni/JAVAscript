function main(): void {
  let sum: number = 0;
  for (let i: number = 0; i < 10; i += 1) {
    sum += i;
  }
  console.log("Sum is:");
  console.log(sum); // 45

  let count: number = 0;
  console.log("While loop:");
  while (count < 5) {
    console.log(count);
    count += 1;
  }
}

main();
