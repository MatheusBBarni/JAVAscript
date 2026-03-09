public class Test_15_string_methods {
  public static void main() {
    String greeting = "Hello, World!";
    System.out.println("length:");
    System.out.println(greeting.length());
    System.out.println("upper:");
    System.out.println(greeting.toUpperCase ());
    System.out.println("substring:");
    System.out.println(greeting.substring (0, 5));
    System.out.println("includes:");
    System.out.println(greeting.contains("World"));
    System.out.println(greeting.contains("Java"));
    System.out.println("replace:");
    System.out.println(greeting.replace ("World", "Java"));
    System.out.println("split:");
    String[] parts = greeting.split (", ");
    System.out.println(parts.length);
  }

  public static void main(String[] args) {
    main ();
  }
}
