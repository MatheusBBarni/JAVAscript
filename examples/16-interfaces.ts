interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return "Hello " + user.name;
}

function main(): void {
  // @ts-ignore
  const user: User = new User();
  user.name = "Alice";
  user.age = 30;
  console.log(greet(user));
}

main();
