import java.net.URI;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.OutputStream;
import java.io.InputStream;

/**
 * Wrapper around java.net.http (client) and com.sun.net.httpserver (server)
 * to match the Node.js 'http' module API surface.
 */
public class Http {

    // ============================
    // Client-side (http.get)
    // ============================

    @FunctionalInterface
    public interface ResponseHandler {
        void handle(Response res);
    }

    @FunctionalInterface
    public interface DataHandler {
        void handle(String chunk);
    }

    @FunctionalInterface
    public interface EndHandler {
        void handle();
    }

    /**
     * Represents an HTTP client response, allowing event-based consumption
     * that mirrors the Node.js res.on('data', ...) / res.on('end', ...) pattern.
     */
    public static class Response {
        private final String body;
        private DataHandler dataHandler;
        private EndHandler endHandler;

        public Response(String body) {
            this.body = body;
        }

        public void on(String event, DataHandler handler) {
            if ("data".equals(event)) {
                this.dataHandler = handler;
            }
        }

        public void on(String event, EndHandler handler) {
            if ("end".equals(event)) {
                this.endHandler = handler;
            }
        }

        void emit() {
            if (dataHandler != null) {
                dataHandler.handle(body);
            }
            if (endHandler != null) {
                endHandler.handle();
            }
        }
    }

    /**
     * Performs an HTTP GET request and invokes the handler with a Response object.
     * Mirrors: http.get(url, (res) => { ... })
     */
    public static void get(String url, ResponseHandler handler) {
        new Thread(() -> {
            try {
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .GET()
                        .build();
                HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());
                Response response = new Response(httpResponse.body());
                handler.handle(response);
                response.emit();
            } catch (Exception e) {
                throw new RuntimeException("HTTP GET failed: " + url, e);
            }
        }).start();
    }

    // ============================
    // Server-side (http.createServer)
    // ============================

    @FunctionalInterface
    public interface RequestHandler {
        void handle(ServerRequest req, ServerResponse res);
    }

    /**
     * Wraps an incoming HTTP request.
     * Mirrors the Node.js `req` object in server callbacks.
     */
    public static class ServerRequest {
        private final HttpExchange exchange;

        public ServerRequest(HttpExchange exchange) {
            this.exchange = exchange;
        }

        public String getMethod() {
            return exchange.getRequestMethod();
        }

        public String getUrl() {
            return exchange.getRequestURI().toString();
        }

        public String getBody() {
            try {
                InputStream is = exchange.getRequestBody();
                return new String(is.readAllBytes());
            } catch (Exception e) {
                return "";
            }
        }
    }

    /**
     * Wraps an outgoing HTTP response.
     * Mirrors the Node.js `res` object with writeHead() and end().
     */
    public static class ServerResponse {
        private final HttpExchange exchange;
        private int statusCode = 200;

        public ServerResponse(HttpExchange exchange) {
            this.exchange = exchange;
        }

        /**
         * Sets the status code and reason phrase.
         * Mirrors: res.writeHead(statusCode, statusMessage)
         */
        public void writeHead(int statusCode, String statusMessage) {
            this.statusCode = statusCode;
        }

        /**
         * Sets the status code.
         * Mirrors: res.writeHead(statusCode)
         */
        public void writeHead(int statusCode) {
            this.statusCode = statusCode;
        }

        /**
         * Sends the response body and finishes the response.
         * Mirrors: res.end(body)
         */
        public void end(String body) {
            try {
                byte[] bytes = body.getBytes();
                exchange.sendResponseHeaders(statusCode, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } catch (Exception e) {
                throw new RuntimeException("Failed to send response", e);
            }
        }

        /**
         * Finishes the response with no body.
         * Mirrors: res.end()
         */
        public void end() {
            end("");
        }
    }

    /**
     * Wraps a com.sun.net.httpserver.HttpServer.
     * Mirrors the Node.js Server returned by http.createServer().
     */
    public static class Server {
        private final HttpServer httpServer;

        public Server(HttpServer httpServer) {
            this.httpServer = httpServer;
        }

        /**
         * Starts listening on the given port.
         * Mirrors: server.listen(port, callback)
         */
        public void listen(int port, Runnable callback) {
            try {
                httpServer.bind(new InetSocketAddress(port), 0);
                httpServer.start();
                if (callback != null) {
                    callback.run();
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to start server on port " + port, e);
            }
        }

        /**
         * Starts listening on the given port (no callback).
         */
        public void listen(int port) {
            listen(port, null);
        }
    }

    /**
     * Creates an HTTP server that handles all requests with the given handler.
     * Mirrors: http.createServer((req, res) => { ... })
     */
    public static Server createServer(RequestHandler handler) {
        try {
            HttpServer server = HttpServer.create();
            server.createContext("/", exchange -> {
                ServerRequest req = new ServerRequest(exchange);
                ServerResponse res = new ServerResponse(exchange);
                handler.handle(req, res);
            });
            return new Server(server);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create HTTP server", e);
        }
    }
}
