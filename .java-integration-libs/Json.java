import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Wrapper around Jackson to match the JavaScript JSON global API.
 * Provides JSON.parse() and JSON.stringify() equivalents.
 */
public class Json {
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Parses a JSON string into a JsonObject.
     * Mirrors: JSON.parse(text)
     */
    public static JsonObject parse(String text) {
        try {
            JsonNode node = mapper.readTree(text);
            if (node.isObject()) {
                return new JsonObject((ObjectNode) node);
            }
            throw new RuntimeException("JSON.parse: expected an object, got " + node.getNodeType());
        } catch (Exception e) {
            throw new RuntimeException("JSON.parse failed: " + e.getMessage(), e);
        }
    }

    /**
     * Converts a JsonObject back to a JSON string.
     * Mirrors: JSON.stringify(obj)
     */
    public static String stringify(JsonObject obj) {
        try {
            return mapper.writeValueAsString(obj.node());
        } catch (Exception e) {
            throw new RuntimeException("JSON.stringify failed: " + e.getMessage(), e);
        }
    }

    /**
     * Converts any object to a JSON string.
     * Mirrors: JSON.stringify(value)
     */
    public static String stringify(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("JSON.stringify failed: " + e.getMessage(), e);
        }
    }

    /**
     * Dynamic wrapper around Jackson ObjectNode for JS-like property access.
     * Usage:
     *   JsonObject obj = Json.parse("{...}");
     *   String name = obj.get("name");    // returns string value
     *   obj.set("name", "Bob");           // sets string value
     *   obj.set("age", 25);              // sets numeric value
     */
    public static class JsonObject {
        private final ObjectNode objectNode;

        public JsonObject(ObjectNode objectNode) {
            this.objectNode = objectNode;
        }

        /** Get a string property */
        public String get(String key) {
            JsonNode val = objectNode.get(key);
            if (val == null || val.isNull()) return null;
            return val.asText();
        }

        /** Get an int property */
        public int getInt(String key) {
            return objectNode.get(key).asInt();
        }

        /** Get a double property */
        public double getDouble(String key) {
            return objectNode.get(key).asDouble();
        }

        /** Get a boolean property */
        public boolean getBoolean(String key) {
            return objectNode.get(key).asBoolean();
        }

        /** Set a string property */
        public void set(String key, String value) {
            objectNode.put(key, value);
        }

        /** Set an int property */
        public void set(String key, int value) {
            objectNode.put(key, value);
        }

        /** Set a double property */
        public void set(String key, double value) {
            objectNode.put(key, value);
        }

        /** Set a boolean property */
        public void set(String key, boolean value) {
            objectNode.put(key, value);
        }

        /** Access the underlying ObjectNode */
        public ObjectNode node() {
            return objectNode;
        }

        @Override
        public String toString() {
            try {
                return new ObjectMapper().writeValueAsString(objectNode);
            } catch (Exception e) {
                return objectNode.toString();
            }
        }
    }
}
