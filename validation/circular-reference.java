public class CircularReferenceDemo {
    static class Node {
        String val;
        Node next;
        Node(String val) { this.val = val; }
    }
    public static void main(String[] args) {
        Node a = new Node("A");
        Node b = new Node("B");
        a.next = b;
        b.next = a;
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: a -> @obj_a, b -> @obj_b
   Heap: @obj_a.next -> @obj_b, @obj_b.next -> @obj_a
   Graph: 2 Node objects + 2 String objects, 2 Directed Reference Edges (@obj_a <-> @obj_b)
   Invariants: Zero infinite recursion, zero duplicate nodes.
*/
