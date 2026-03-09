import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Wrapper around java.net.http to match the Node.js 'http' module API surface.
 * Used by the JAVAscript transpiler for http-related calls.
 */
public class Http {

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
     * Represents an HTTP response, allowing event-based consumption
     * that mirrors the Node.js res.on('data', ...) / res.on('end', ...) pattern.
     */
    public static class Response {
        private final String body;
        private DataHandler dataHandler;
        private EndHandler endHandler;

        public Response(String body) {
            this.body = body;
        }

        /**
         * Register a data event handler: receives the body as a single chunk.
         * Matches: res.on('data', (chunk) => { ... })
         */
        public void on(String event, DataHandler handler) {
            if ("data".equals(event)) {
                this.dataHandler = handler;
            }
        }

        /**
         * Register an end event handler: fires after data has been delivered.
         * Matches: res.on('end', () => { ... })
         */
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
}
