public class Test_11_unary_logical {
  public static void main() {
    double x = 10;
    double neg = -x;
    System.out.println("neg:");
    System.out.println(neg);
    boolean y = true;
    boolean z = false;
    System.out.println("!y:");
    System.out.println(!y);
    if (y && !z ) 
      {
        System.out.println("Both true");
      }
    if (y || z ) 
      {
        System.out.println("At least one is true");
      }
    if (!y || z ) 
      {
        System.out.println("Never happens");
      }
    else 
      {
        System.out.println("Expected else");
      }
  }

  public static void main(String[] args) {
    main ();
  }
}
