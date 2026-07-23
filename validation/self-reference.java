public class SelfReferenceDemo {
    static class Node {
        Node self;
        Node() { this.self = this; }
    }
    public static void main(String[] args) {
        Node n = new Node();
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: n -> @obj_1
   Heap: @obj_1.self -> @obj_1
   Graph: 1 Node (@obj_1), 1 Self-Loop Edge (@obj_1 -> @obj_1, field: "self")
*/
