function getDayName(day: number): string {
  var name: string = "";
  switch (day) {
    case 1:
      name = "Monday";
      break;
    case 2:
      name = "Tuesday";
      break;
    case 3:
      name = "Wednesday";
      break;
    default:
      name = "Unknown";
      break;
  }
  return name;
}

function processAction(action: string): void {
  switch (action) {
    case "start":
    case "resume":
      console.log("Playing");
      break;
    case "stop":
      console.log("Stopped");
      break;
    default:
      console.log("Unknown action");
  }
}

function main(): void {
  console.log(getDayName(2));
  console.log(getDayName(4));

  processAction("resume");
  processAction("pause");
}

main();
