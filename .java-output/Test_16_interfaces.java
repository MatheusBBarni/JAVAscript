public class Test_16_interfaces {
public static class User {
    public String name;
    public double age;
  }

  public static String greet(User user) {
    return "Hello " + user.name ;
  }

  public static void main() {
    User user = new User();
    user.name = "Alice" ;
    user.age = 30 ;
    System.out.println(greet (user));
  }

  public static void main(String[] args) {
    main ();
  }
}
