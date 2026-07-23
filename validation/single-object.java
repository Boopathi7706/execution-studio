public class SingleObjectDemo {
    static class Student {
        String name;
        int age;
        Student(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }
    public static void main(String[] args) {
        Student s = new Student("Alice", 21);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: s -> @obj_1
   Heap: @obj_1 = Student { name: "Alice" (@obj_2), age: 21 }
   Graph: @obj_1 (Student) -> @obj_2 (String)
*/
