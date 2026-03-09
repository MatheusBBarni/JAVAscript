public class Test_14_switch_case {
  public static String getDayName(double day) {
    String name = "\"\"";
    switch ((int) (day)) {
      case 1:
        name = "Monday" ;
        break;
      case 2:
        name = "Tuesday" ;
        break;
      case 3:
        name = "Wednesday" ;
        break;
      default:
        name = "Unknown" ;
        break;
    }
    return name;
  }

  public static void processAction(String action) {
    switch (action) {
      case "start":
      case "resume":
        System.out.println("Playing");
        break;
      case "stop":
        System.out.println("Stopped");
        break;
      default:
        System.out.println("Unknown action");
    }
  }

  public static void main() {
    System.out.println(getDayName (2));
    System.out.println(getDayName (4));
    processAction ("resume");
    processAction ("pause");
  }

  public static void main(String[] args) {
    main ();
  }
}
