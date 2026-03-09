public class Test_08_read_write_file {
  public static void main() {
    String text = "Hello from JAVAscript!";
    Fs.writeFileSync("test-output.txt", text);
    System.out.println("File written successfully");
    String content = Fs.readFileSync("test-output.txt", "utf-8");
    System.out.println(content);
    String lines = "line1\\nline2\\nline3";
    Fs.writeFileSync("multiline.txt", lines);
    System.out.println("Multiline file written");
    String read = Fs.readFileSync("multiline.txt", "utf-8");
    System.out.println(read);
  }

  public static void main(String[] args) {
    main();
  }
}
