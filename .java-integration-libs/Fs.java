import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Wrapper around java.nio.file to match the Node.js 'fs' module API surface.
 * Used by the JAVAscript transpiler for fs-related calls.
 */
public class Fs {

    @FunctionalInterface
    public interface Callback {
        void call(RuntimeException err);
    }

    /**
     * Writes data to a file asynchronously (simulated with a thread).
     * Mirrors: fs.writeFile(path, data, callback)
     */
    public static void writeFile(String path, String data, Callback callback) {
        new Thread(() -> {
            try {
                Files.writeString(Paths.get(path), data);
                callback.call(null);
            } catch (Exception e) {
                callback.call(new RuntimeException(e));
            }
        }).start();
    }

    /**
     * Writes data to a file synchronously.
     * Mirrors: fs.writeFileSync(path, data)
     */
    public static void writeFileSync(String path, String data) {
        try {
            Files.writeString(Paths.get(path), data);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Reads file content synchronously.
     * Mirrors: fs.readFileSync(path, encoding)
     */
    public static String readFileSync(String path, String encoding) {
        try {
            return Files.readString(Paths.get(path));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Reads file content synchronously (single-arg variant).
     * Mirrors: fs.readFileSync(path)
     */
    public static String readFileSync(String path) {
        return readFileSync(path, "utf-8");
    }
}
