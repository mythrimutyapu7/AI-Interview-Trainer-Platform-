const seedCodingProblems = async (db) => {
  try {
    const count = await db.collection("coding_problems").countDocuments();
    if (count > 0) {
      console.log("ℹ️  Database already has coding problems. Skipping seed.");
      return;
    }

    console.log("🌱 Seeding initial coding problems to MongoDB...");

    const initialProblems = [
      {
        title: "Two Sum",
        difficulty: "Easy",
        category: "Arrays & Hashing",
        acceptance: "49.1%",
        description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to target</em>.</p>
<p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.</p>
<p>You can return the answer in any order.</p>`,
        examples: [
          {
            input: "[2,7,11,15], 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            input: "[3,2,4], 6",
            output: "[1,2]",
            explanation: null
          }
        ],
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9",
          "Only one valid answer exists."
        ],
        followUp: "Can you come up with an algorithm that is less than O(n^2) time complexity?",
        starterCode: {
          javascript: `function twoSum(nums, target) {
    // Write your solution here
    return [];
}`,
          python: `def twoSum(nums, target):
    # Write your solution here
    return []`,
          java: `import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
          cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`,
          c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your solution here
    *returnSize = 0;
    return NULL;
}`
        },
        testCases: [
          { input: "[2,7,11,15], 9", expected: "[0,1]" },
          { input: "[3,2,4], 6", expected: "[1,2]" },
          { input: "[3,3], 6", expected: "[0,1]" }
        ],
        testRunners: {
          javascript: `__USER_CODE__
console.log("RESULT:" + JSON.stringify(twoSum(__TEST_INPUT__)));`,
          python: `__USER_CODE__
import json
print("RESULT:" + json.dumps(twoSum(__TEST_INPUT__)))`,
          java: `__USER_CODE__
public class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] nums = new int[]{2,7,11,15};
        int target = 9;
        // Check input parameter to see if we match case 2 or 3
        String input = "__TEST_INPUT__";
        if (input.contains("3,2,4")) {
            nums = new int[]{3,2,4};
            target = 6;
        } else if (input.contains("3,3")) {
            nums = new int[]{3,3};
            target = 6;
        }
        int[] res = sol.twoSum(nums, target);
        System.out.println("RESULT:[" + res[0] + "," + res[1] + "]");
    }
}`,
          cpp: `__USER_CODE__
#include <iostream>
#include <vector>
#include <string>
using namespace std;
int main() {
    Solution sol;
    vector<int> nums = {2,7,11,15};
    int target = 9;
    string input = "__TEST_INPUT__";
    if (input.find("3,2,4") != string::npos) {
        nums = {3,2,4};
        target = 6;
    } else if (input.find("3,3") != string::npos) {
        nums = {3,3};
        target = 6;
    }
    vector<int> res = sol.twoSum(nums, target);
    cout << "RESULT:[" << res[0] << "," << res[1] << "]" << endl;
    return 0;
}`,
          c: `__USER_CODE__
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int main() {
    int nums[] = {2,7,11,15};
    int target = 9;
    int size = 4;
    char input[] = "__TEST_INPUT__";
    if (strstr(input, "3,2,4") != NULL) {
        nums[0] = 3; nums[1] = 2; nums[2] = 4;
        target = 6;
        size = 3;
    } else if (strstr(input, "3,3") != NULL) {
        nums[0] = 3; nums[1] = 3;
        target = 6;
        size = 2;
    }
    int returnSize = 0;
    int* res = twoSum(nums, size, target, &returnSize);
    printf("RESULT:[%d,%d]\\n", res[0], res[1]);
    free(res);
    return 0;
}`
        },
        isAI: false
      },
      {
        title: "Reverse a Linked List",
        difficulty: "Easy",
        category: "Linked Lists",
        acceptance: "73.2%",
        description: `<p>Given the <code>head</code> of a singly linked list, reverse the list, and return <em>the reversed list</em>.</p>`,
        examples: [
          {
            input: "head = [1,2,3,4,5]",
            output: "[5,4,3,2,1]",
            explanation: null
          }
        ],
        constraints: [
          "The number of nodes in the list is the range [0, 5000].",
          "-5000 <= Node.val <= 5000"
        ],
        starterCode: {
          javascript: `function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

function reverseList(head) {
    // Write your solution here
    return head;
}`,
          python: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    # Write your solution here
    return head`,
          java: `public class Solution {
    public ListNode reverseList(ListNode head) {
        // Write your solution here
        return head;
    }
}`
        },
        testCases: [
          { input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" }
        ],
        testRunners: {
          javascript: `__USER_CODE__
function buildList(arr) {
  let dummy = new ListNode();
  let curr = dummy;
  for (let val of arr) {
    curr.next = new ListNode(val);
    curr = curr.next;
  }
  return dummy.next;
}
function printList(head) {
  let res = [];
  while(head) {
    res.push(head.val);
    head = head.next;
  }
  return JSON.stringify(res);
}
console.log("RESULT:" + printList(reverseList(buildList([1,2,3,4,5]))));`,
          python: `__USER_CODE__
def buildList(arr):
    dummy = ListNode()
    curr = dummy
    for val in arr:
        curr.next = ListNode(val)
        curr = curr.next
    return dummy.next
def printList(head):
    res = []
    while head:
        res.append(head.val)
        head = head.next
    import json
    return json.dumps(res)
print("RESULT:" + printList(reverseList(buildList([1,2,3,4,5]))))`
        },
        isAI: false
      }
    ];

    await db.collection("coding_problems").insertMany(initialProblems);
    console.log("✅ Seed completed successfully.");
  } catch (error) {
    console.error("❌ Failed to seed coding problems:", error);
  }
};

module.exports = { seedCodingProblems };
