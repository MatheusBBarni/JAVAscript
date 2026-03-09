class Person {
  public String name;

  public  Person(String name) {
    this.name = name;
  }
}

public class Test_04_exports {
  public static double add(double a, double b) {
    return a + b;
  }

  public static void main(String[] args) {
    double PI = 3.14;
    String privateVar = "hidden";
  }
}
