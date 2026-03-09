public class Test_13_try_catch {
  public static double riskyFunction(double a, double b) {
    if (b == 0 ) 
      {
        throw new RuntimeException("Division by zero");
      }
    return a / b ;
  }

  public static void main() {
    try {
      System.out.println(riskyFunction (10, 2));
      System.out.println(riskyFunction (10, 0));
      System.out.println("This will not be printed");
    } catch (Exception e) {
      System.out.println("Caught an error");
    } finally {
      System.out.println("Finally block executed");
    }
  }

  public static void main(String[] args) {
    main ();
  }
}
