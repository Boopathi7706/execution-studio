public class ArraysDemo {
    public static void main(String[] args) {
        int[] numbers = new int[]{10, 20, 30, 40};
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: numbers -> @obj_arr
   Heap: @obj_arr = int[] Length: 4, [0] 10, [1] 20, [2] 30, [3] 40
   Graph: 1 ARRAY Node (@obj_arr), 0 outgoing edges (primitives stay in card)
*/
