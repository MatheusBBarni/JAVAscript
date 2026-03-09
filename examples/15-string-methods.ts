function main(): void {
  const greeting: string = 'Hello, World!';

  console.log("length:");
  console.log(greeting.length);

  console.log("upper:");
  console.log(greeting.toUpperCase());

  console.log("substring:");
  console.log(greeting.substring(0, 5));

  console.log("includes:");
  console.log(greeting.includes('World'));
  console.log(greeting.includes('Java'));

  console.log("replace:");
  console.log(greeting.replace('World', 'Java'));

  console.log("split:");
  const parts: string[] = greeting.split(', ');
  console.log(parts.length); // JS Arrays aren't printed nicely in Java without Arrays.toString, so just length for now until Array literals
}

main();
