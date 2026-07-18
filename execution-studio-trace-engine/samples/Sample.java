public class Sample {
    static int square(int x) {
        return x * x;
    }

    public static void main(String[] args) {
        int a = 5;
        int b = 10;
        int[] arr = {1, 2, 3};
        int sum = 0;
        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        int sq = square(a);
        Point p = new Point(a, b);
        System.out.println(sum + sq + p.x);
    }
}

class Point {
    int x, y;
    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}
