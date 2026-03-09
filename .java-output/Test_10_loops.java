public class Test_10_loops {
  public static void main() {
    double sum = 0;
    for (double i = 0; i < 10 ; i += 1 ) {
      sum += i ;
    }
    System.out.println("Sum is:");
    System.out.println(sum);
    double count = 0;
    System.out.println("While loop:");
    while (count < 5 ) {
      System.out.println(count);
      count += 1 ;
    }
  }

  public static void main(String[] args) {
    main ();
  }
}
