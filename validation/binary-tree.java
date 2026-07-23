public class BinaryTreeDemo {
    static class TreeNode {
        int val;
        TreeNode left;
        TreeNode right;
        TreeNode(int val) { this.val = val; }
    }
    public static void main(String[] args) {
        TreeNode root = new TreeNode(1);
        root.left = new TreeNode(2);
        root.right = new TreeNode(3);
    }
}
/* EXPECTED VISUALIZATION STATE:
   Variables: root -> @obj_root
   Heap: @obj_root.left -> @obj_left, @obj_root.right -> @obj_right
   Graph: @obj_root with 2 outgoing directed edges ("left", "right") to @obj_left and @obj_right.
*/
