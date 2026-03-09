import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

/**
 * Wrapper around Jackson to match the JavaScript JSON global API.
 * Provides JSON.parse() and JSON.stringify() equivalents.
 */
public class Json {
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Parses a JSON string into a JsonObject.
     * Mirrors: JSON.parse(text) for objects
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
     * Parses a JSON string into a JsonArray.
     * Mirrors: JSON.parse(text) for arrays
     */
    public static JsonArray parseArray(String text) {
        try {
            JsonNode node = mapper.readTree(text);
            if (node.isArray()) {
                return new JsonArray((ArrayNode) node);
            }
            throw new RuntimeException("JSON.parseArray: expected an array, got " + node.getNodeType());
        } catch (Exception e) {
            throw new RuntimeException("JSON.parseArray failed: " + e.getMessage(), e);
        }
    }

    /**
     * Converts a JsonObject back to a JSON string.
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
     */
    public static class JsonObject {
        private final ObjectNode objectNode;

        public JsonObject(ObjectNode objectNode) {
            this.objectNode = objectNode;
        }

        public String get(String key) {
            JsonNode val = objectNode.get(key);
            if (val == null || val.isNull()) return null;
            return val.asText();
        }

        public int getInt(String key) {
            return objectNode.get(key).asInt();
        }

        public double getDouble(String key) {
            return objectNode.get(key).asDouble();
        }

        public boolean getBoolean(String key) {
            return objectNode.get(key).asBoolean();
        }

        public void set(String key, String value) { objectNode.put(key, value); }
        public void set(String key, int value) { objectNode.put(key, value); }
        public void set(String key, double value) { objectNode.put(key, value); }
        public void set(String key, boolean value) { objectNode.put(key, value); }

        public ObjectNode node() { return objectNode; }

        @Override
        public String toString() {
            try {
                return mapper.writeValueAsString(objectNode);
            } catch (Exception e) {
                return objectNode.toString();
            }
        }
    }

    /**
     * Dynamic wrapper around Jackson ArrayNode for JS-like array access.
     */
    public static class JsonArray {
        private final ArrayNode arrayNode;

        public JsonArray(ArrayNode arrayNode) {
            this.arrayNode = arrayNode;
        }

        /**
         * Finds the first object in the array where key equals value.
         * Mirrors: array.find(item => item[key] === value)
         */
        public JsonObject find(String key, String value) {
            for (JsonNode node : arrayNode) {
                if (node.isObject() && node.has(key)) {
                    if (node.get(key).asText().equals(value)) {
                        return new JsonObject((ObjectNode) node);
                    }
                }
            }
            return null;
        }

        public int size() { return arrayNode.size(); }

        public ObjectNode node() { return null; }

        @Override
        public String toString() {
            try {
                return mapper.writeValueAsString(arrayNode);
            } catch (Exception e) {
                return arrayNode.toString();
            }
        }
    }
}
