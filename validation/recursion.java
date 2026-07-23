public class RecursionDemo {
    static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
    public static void main(String[] args) {
        int result = factorial(4);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Call Stack: factorial(1) -> factorial(2) -> factorial(3) -> factorial(4) -> main() (5 Stack Frames)
   Variables: Each frame maintains distinct `n` parameter value.
   Timeline: Stepping updates frame depth and line markers synchronously across panels.
*/
