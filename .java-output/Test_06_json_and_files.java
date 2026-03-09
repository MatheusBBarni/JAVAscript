public class Test_06_json_and_files {
  public static void main() {
    String data = "{\"name\":\"Alice\",\"age\":30}";
    var obj = Json.parse  (data);
    System.out.println(obj.get("name"));
    System.out.println(obj.get("age"));
    obj.set("name", "Bob");
    obj.set("age", 25);
    String result = Json.stringify  (obj);
    System.out.println(result);
    Fs.writeFileSync ("output.json", result);
    System.out.println("JSON written to output.json");
    String content = Fs.readFileSync ("output.json", "utf-8");
    System.out.println(content);
  }

  public static void main(String[] args) {
    main ();
  }
}
