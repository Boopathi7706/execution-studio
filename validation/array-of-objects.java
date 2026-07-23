public class ArrayOfObjectsDemo {
    static class Item {
        int id;
        Item(int id) { this.id = id; }
    }
    public static void main(String[] args) {
        Item[] items = new Item[2];
        items[0] = new Item(101);
        items[1] = new Item(102);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: items -> @obj_arr
   Heap: @obj_arr = Item[] Length: 2, [0] -> @obj_item1, [1] -> @obj_item2
   Graph: 1 ARRAY Node (@obj_arr), 2 OBJECT Nodes (@obj_item1, @obj_item2), 2 Directed Edges ([0], [1])
*/
