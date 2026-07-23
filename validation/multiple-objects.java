public class MultipleObjectsDemo {
    static class Person {
        String id;
        Person(String id) { this.id = id; }
    }
    public static void main(String[] args) {
        Person p1 = new Person("P101");
        Person p2 = new Person("P102");
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: p1 -> @obj_1, p2 -> @obj_2
   Heap: @obj_1 = Person { id: "P101" }, @obj_2 = Person { id: "P102" }
   Graph: 4 Nodes (@obj_1, @obj_2, String 1, String 2), 2 Directed Edges
*/
