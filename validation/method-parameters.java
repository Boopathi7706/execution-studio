public class MethodParametersDemo {
    static class User {
        String name;
        User(String name) { this.name = name; }
    }
    static void process(User u, int count) {
        int temp = count * 2;
    }
    public static void main(String[] args) {
        User user = new User("Alice");
        process(user, 5);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Call Stack: process() [Frame #0], main() [Frame #1]
   Variables (process frame): u -> @obj_user, count = 5, temp = 10
   Heap & Graph: @obj_user node remains connected and inspectable across frame transitions.
*/
