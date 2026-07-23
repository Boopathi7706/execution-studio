public class MethodReturnDemo {
    static class Result {
        int code;
        Result(int code) { this.code = code; }
    }
    static Result createResult() {
        return new Result(200);
    }
    public static void main(String[] args) {
        Result res = createResult();
    }
}
/* EXPECTED VISUALIZATION STATE:
   Call Stack: createResult() pops off stack; main() becomes active top frame.
   Variables (main frame): res -> @obj_res
   Heap & Graph: @obj_res (Result code: 200) persists on heap.
*/
