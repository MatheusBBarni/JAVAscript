function sumArray(arr: number[]): number {
  let sum = 0;
  for (const val of arr) {
    sum += val;
  }
  return sum;
}

function processStrings(words: string[]): void {
  for (const word of words) {
    console.log(word);
  }
}

function main(): void {
  const numbers = [10, 20, 30, 40];
  console.log(sumArray(numbers));

  const strings = ["apple", "banana", "cherry"];
  processStrings(strings);
}

main();
