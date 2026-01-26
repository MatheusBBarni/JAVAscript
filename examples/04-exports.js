export const PI = 3.14;

export function add(a, b) {
  return a + b;
}

export class Person {
  constructor(name) {
    this.name = name;
  }
}

const privateVar = "hidden";
export { privateVar };
