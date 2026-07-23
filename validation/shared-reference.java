public class SharedReferenceDemo {
    static class Address { String city; Address(String c) { this.city = c; } }
    static class Person { String name; Address addr; Person(String n, Address a) { this.name = n; this.addr = a; } }

    public static void main(String[] args) {
        Address sharedAddr = new Address("Chennai");
        Person p1 = new Person("Alice", sharedAddr);
        Person p2 = new Person("Bob", sharedAddr);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: sharedAddr -> @obj_addr, p1 -> @obj_p1, p2 -> @obj_p2
   Heap: @obj_p1.addr -> @obj_addr, @obj_p2.addr -> @obj_addr
   Graph: Exactly 1 Address node (@obj_addr) with 2 incoming reference edges (from @obj_p1 and @obj_p2).
   Inspector: Inspecting @obj_addr shows Incoming Refs = 2 (p1.addr, p2.addr).
*/
