export const PI: number = 3.14;

export function add(a: number, b: number): number {
  return a + b;
}

export class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const privateVar: string = "hidden";
export { privateVar };
