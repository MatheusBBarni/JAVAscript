public class Test_07_http_server {
  public static void handler(Object req, Object res) {
    res.writeHead(200, "OK");
    res.end("Hello from JAVAscript server!");
  }

  public static void main(String[] args) {
    final var server = Http.createServer(handler);
    server.listen(3000, () -> {
      System.out.println("Server running on port 3000");
    });
  }
}
