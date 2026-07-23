public class StringsDemo {
    public static void main(String[] args) {
        String s1 = "hello";
        String s2 = new String("world");
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: s1 = "hello", s2 -> @obj_str2
   Heap: @obj_str2 = java.lang.String "world"
   Graph: 1 STRING Node (@obj_str2)
*/
