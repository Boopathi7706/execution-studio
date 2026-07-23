public class LinkedListDemo {
    static class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }
    public static void main(String[] args) {
        Node n1 = new Node(10);
        Node n2 = new Node(20);
        Node n3 = new Node(30);
        n1.next = n2;
        n2.next = n3;
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: n1 -> @obj_1, n2 -> @obj_2, n3 -> @obj_3
   Heap: @obj_1.next -> @obj_2, @obj_2.next -> @obj_3, @obj_3.next -> null
   Graph: Linear sequence @obj_1 -> @obj_2 -> @obj_3 (0 null nodes generated)
*/
