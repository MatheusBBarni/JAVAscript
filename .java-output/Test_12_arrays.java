public class Test_12_arrays {
  public static double sumArray(double[] arr) {
    var sum = 0;
    for (final var val : arr) {
      {
        sum += val ;
      }
    }
    return sum;
  }

  public static void processStrings(String[] words) {
    for (final var word : words) {
      {
        System.out.println(word);
      }
    }
  }

  public static void main() {
    final var numbers = new double[]{10, 20, 30, 40};
    System.out.println(sumArray (numbers));
    final var strings = new String[]{"apple", "banana", "cherry"};
    processStrings (strings);
  }

  public static void main(String[] args) {
    main ();
  }
}
