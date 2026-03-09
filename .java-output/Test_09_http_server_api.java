public class Test_09_http_server_api {
  public static void handler(Http.ServerRequest req, Http.ServerResponse res) {
    String fileContent = Fs.readFileSync ("examples/test-data/users.json", "utf-8");
    if ("/all".equals(req.url)) 
      {
        res.writeHead (200, "OK");
        res.end (fileContent);
      }
    else if (req.url.startsWith ("/user")) 
      {
        String id = req.query ("id");
        final var users = Json.parseArray  (fileContent);
        final var user = users.find ("id", id);
        if (user != null) 
          {
            res.writeHead (200, "OK");
            res.end (Json.stringify  (user));
          }
        else 
          {
            res.writeHead (404, "Not Found");
            res.end ("User not found");
          }
      }
    else 
      {
        res.writeHead (404, "Not Found");
        res.end ("Not Found");
      }
  }

  public static void main(String[] args) {
    final var server = Http.createServer  (Test_09_http_server_api::handler );
    server.listen (3001, () -> {
      System.out.println("Users API running on port 3001");
    } );
  }
}
