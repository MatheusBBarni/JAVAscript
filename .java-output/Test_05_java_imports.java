import java.lang.Math;

public class Test_05_java_imports {
  public static void main() {
    double pi = Math.PI;
    System.out.println(pi);
    double sqrtTwo = Math.sqrt (2);
    System.out.println(sqrtTwo);
    double maxVal = Math.max (10, 20);
    System.out.println(maxVal);
    double negative = 0 - 42 ;
    double absVal = Math.abs (negative);
    System.out.println(absVal);
    double power = Math.pow (2, 10);
    System.out.println(power);
  }

  public static void main(String[] args) {
    main ();
  }
}
