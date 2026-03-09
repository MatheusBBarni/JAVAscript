public class Test_03_imports {
  public static void main() {
    Http.get  ("http://www.google.com", (res) -> {
      StringBuilder data = new StringBuilder("''");
      res.on ("data", (chunk) -> {
        data.append(chunk);
      } );
      res.on ("end", () -> {
        Fs.writeFile ("google.html", data.toString(), (err) -> {
          if (err != null) 
            throw err;
          System.out.println("Google page saved to google.html");
        } );
      } );
    } );
  }

  public static void main(String[] args) {
    main ();
  }
}
