public class NestedObjectsDemo {
    static class Address { String city; Address(String city) { this.city = city; } }
    static class Manager { String name; Address addr; Manager(String n, Address a) { this.name = n; this.addr = a; } }
    static class Department { String name; Manager mgr; Department(String n, Manager m) { this.name = n; this.mgr = m; } }
    static class Company { String name; Department dept; Company(String n, Department d) { this.name = n; this.dept = d; } }

    public static void main(String[] args) {
        Address a = new Address("San Francisco");
        Manager m = new Manager("Bob", a);
        Department d = new Department("Engineering", m);
        Company c = new Company("Acme Corp", d);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: c -> @obj_company
   Heap & Graph Sequence: Company -> Dept -> Manager -> Address -> String ("San Francisco")
   Graph Nodes: 8 Nodes, 7 Edges (No missing relationships)
*/
