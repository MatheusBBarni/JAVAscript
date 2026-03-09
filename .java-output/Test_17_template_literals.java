public class Test_17_template_literals {
  public static void main() {
    String name = "Alice";
    double age = 30;
    String msg = "Hello " + name + ", you are " + age + " years old!";
    String nested = msg + " And learning Java!";
    System.out.println(nested);
  }

  public static void main(String[] args) {
    main ();
  }
}
