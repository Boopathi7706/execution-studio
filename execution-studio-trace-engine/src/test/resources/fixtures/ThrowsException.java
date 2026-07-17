public class ThrowsException {
    public static void main(String[] args) {
        int a = 10;
        int b = 0;
        int result = a / b;  // ArithmeticException: / by zero
        System.out.println(result);
    }
}
