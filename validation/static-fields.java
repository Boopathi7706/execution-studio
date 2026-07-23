public class StaticFieldsDemo {
    static class Config {
        static String appName = "ExecutionStudio";
        int port = 8080;
    }
    public static void main(String[] args) {
        Config cfg = new Config();
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: cfg -> @obj_cfg
   Heap: @obj_cfg = Config { port: 8080 }
   Graph: @obj_cfg node correctly rendered.
*/
