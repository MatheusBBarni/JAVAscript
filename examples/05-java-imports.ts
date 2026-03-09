// @ts-expect-error - Java package imports
import Math from 'java.lang.Math'

function main(): void {
  const pi: number = Math.PI;
  console.log(pi);

  const sqrtTwo: number = Math.sqrt(2);
  console.log(sqrtTwo);

  const maxVal: number = Math.max(10, 20);
  console.log(maxVal);

  const negative: number = 0 - 42;
  const absVal: number = Math.abs(negative);
  console.log(absVal);

  const power: number = Math.pow(2, 10);
  console.log(power);
}

main();
