import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// 1. Load environment variables reliably
const envPath = resolve(process.cwd(), '.env');
const envLocalPath = resolve(process.cwd(), '.env.local');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("❌ DATABASE_URL environment variable is not set. Check your .env file.");
}

const sql = neon(DATABASE_URL);

// 2. Hardcoded Database (Bypasses the broken GitHub link entirely)
const TARGET_PROBLEMS = [
  {
    slug: "3sum",
    title: "3Sum",
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    optimal_time: "O(n^2)",
    optimal_space: "O(1)",
    boilerplate_cpp: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your optimized solution here...\n        \n    }\n};"
  },
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\n**Example 1:**\n\n    Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]\n    Output: 6",
    optimal_time: "O(n)",
    optimal_space: "O(1)",
    boilerplate_cpp: "#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your optimized solution here...\n        \n    }\n};"
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    optimal_time: "O(n log n)",
    optimal_space: "O(n)",
    boilerplate_cpp: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your optimized solution here...\n        \n    }\n};"
  },
  {
    slug: "longest-consecutive-sequence",
    title: "Longest Consecutive Sequence",
    description: "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in `O(n)` time.",
    optimal_time: "O(n)",
    optimal_space: "O(n)",
    boilerplate_cpp: "#include <vector>\n#include <unordered_set>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Write your optimized solution here...\n        \n    }\n};"
  }
];

async function seed() {
  console.log("🚀 Starting Bulk Fetch (Offline Mode)...");

  try {
    let count = 0;
    for (const problem of TARGET_PROBLEMS) {
      await sql`
        INSERT INTO problems (slug, title, description, optimal_time, optimal_space, boilerplate_cpp)
        VALUES (${problem.slug}, ${problem.title}, ${problem.description}, ${problem.optimal_time}, ${problem.optimal_space}, ${problem.boilerplate_cpp})
        ON CONFLICT (slug) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          optimal_time = EXCLUDED.optimal_time,
          optimal_space = EXCLUDED.optimal_space,
          boilerplate_cpp = EXCLUDED.boilerplate_cpp;
      `;
      
      console.log(`✅ Bulk Seeded: ${problem.title}`);
      count++;
    }

    console.log(`🎉 Success! Added ${count} new problems to your database.`);
  } catch (error) {
    console.error("❌ Bulk fetch failed:", error);
  }
}

seed();