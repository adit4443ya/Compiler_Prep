import { useState, useMemo, useRef } from "react";

const PROBLEMS = [
  // ═══ DP — KNAPSACK ═══
  {
    id: 1, section: "DP — Knapsack", title: "Partition Equal Subset Sum",
    difficulty: "Medium", leetcode: 416, pattern: "0/1 Knapsack — Boolean",
    intuition: "Reduce to: does a subset exist with sum = totalSum/2? This is a classic 0/1 knapsack. dp[s] = can we achieve sum s? For each num, iterate sums BACKWARDS (critical: prevents reuse of the same element). If total is odd, immediately return false.",
    keyInsight: "Reverse inner loop = 0/1 knapsack. Forward inner loop = unbounded knapsack. This single distinction separates two entire problem families.",
    approach: "1) Check if total is odd → false. 2) target = total/2. 3) dp[0] = true. 4) For each num, for s from target down to num: dp[s] |= dp[s-num]. 5) Return dp[target].",
    complexity: "Time: O(N × sum/2) | Space: O(sum/2)",
    code: `class Solution {
public:
    bool canPartition(vector<int>& nums) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        // Odd total can never be split into two equal halves
        if (total % 2 != 0) return false;
        int target = total / 2;
        
        // dp[s] = "can we form sum s using some subset?"
        vector<bool> dp(target + 1, false);
        dp[0] = true; // base: empty subset has sum 0
        
        for (int num : nums) {
            // *** REVERSE TRAVERSAL ***
            // Ensures each element is used at most ONCE (0/1 knapsack)
            // Forward would allow reuse since dp[s-num] might already include 'num'
            for (int s = target; s >= num; s--) {
                dp[s] = dp[s] || dp[s - num];
            }
        }
        return dp[target];
    }
};`
  },
  {
    id: 2, section: "DP — Knapsack", title: "Target Sum",
    difficulty: "Medium", leetcode: 494, pattern: "Knapsack — Count subsets with given difference",
    intuition: "Assign + or - to each num to reach target S. Let P = positive subset, N = negative subset. P - N = S and P + N = total. So P = (S + total) / 2. Now count subsets summing to P — a standard knapsack count problem.",
    keyInsight: "Many +/- assignment problems reduce to subset sum via: positiveSubset = (target + total) / 2. Check for (target+total) being even and non-negative.",
    approach: "1) Compute newTarget = (target + total) / 2. 2) Check validity. 3) dp[0] = 1. 4) For each num, reverse: dp[s] += dp[s-num]. 5) Return dp[newTarget].",
    complexity: "Time: O(N × target) | Space: O(target)",
    code: `class Solution {
public:
    int findTargetSumWays(vector<int>& nums, int target) {
        int total = accumulate(nums.begin(), nums.end(), 0);
        // Impossible: target too large or parity mismatch
        if (abs(target) > total) return 0;
        if ((total + target) % 2 != 0) return 0;
        
        int newTarget = (total + target) / 2;
        // dp[s] = number of subsets that sum to s
        vector<int> dp(newTarget + 1, 0);
        dp[0] = 1; // one way to make sum 0: pick nothing
        
        for (int num : nums) {
            for (int s = newTarget; s >= num; s--) {
                dp[s] += dp[s - num]; // 0/1: reverse loop
            }
        }
        return dp[newTarget];
    }
};`
  },
  {
    id: 3, section: "DP — Knapsack", title: "Coin Change (Minimum Coins)",
    difficulty: "Medium", leetcode: 322, pattern: "Unbounded Knapsack — Minimize",
    intuition: "Each coin can be used unlimited times → unbounded knapsack. dp[a] = min coins for amount a. FORWARD loop allows reuse. dp[a] = min(dp[a], dp[a-coin] + 1). Initialize dp[0]=0, rest=INF.",
    keyInsight: "Forward inner loop allows unlimited reuse (unbounded). This is the ONLY structural difference from 0/1 knapsack. For counting problems, outer loop order matters for combos vs perms.",
    approach: "1) dp of size amount+1, init INT_MAX. 2) dp[0] = 0. 3) For each coin, forward loop: dp[a] = min(dp[a], dp[a-coin]+1).",
    complexity: "Time: O(N × amount) | Space: O(amount)",
    code: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // dp[i] = minimum coins to make amount i
        vector<int> dp(amount + 1, INT_MAX);
        dp[0] = 0; // 0 coins for amount 0
        
        for (int coin : coins) {
            // *** FORWARD LOOP *** → allows reusing same coin (unbounded)
            for (int a = coin; a <= amount; a++) {
                if (dp[a - coin] != INT_MAX) {
                    dp[a] = min(dp[a], dp[a - coin] + 1);
                }
            }
        }
        return dp[amount] == INT_MAX ? -1 : dp[amount];
    }
};`
  },
  {
    id: 4, section: "DP — Knapsack", title: "Coin Change II (Count Combinations)",
    difficulty: "Medium", leetcode: 518, pattern: "Unbounded Knapsack — Count combos",
    intuition: "Count COMBINATIONS (not permutations). Outer loop MUST be coins, inner loop = amounts. This ensures [1,2] and [2,1] are counted once. Swap loops → you count permutations (LC 377).",
    keyInsight: "Outer=coins Inner=amounts → combinations. Outer=amounts Inner=coins → permutations. Critical interview distinction.",
    approach: "1) dp[0] = 1. 2) Outer: each coin. 3) Inner: amount from coin to target. 4) dp[a] += dp[a - coin].",
    complexity: "Time: O(N × amount) | Space: O(amount)",
    code: `class Solution {
public:
    int change(int amount, vector<int>& coins) {
        vector<int> dp(amount + 1, 0);
        dp[0] = 1; // one way to make 0: use no coins
        
        // OUTER = coins → COMBINATIONS (coin order fixed)
        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                dp[a] += dp[a - coin];
            }
        }
        return dp[amount];
    }
};`
  },

  // ═══ DP — STRING ═══
  {
    id: 5, section: "DP — String", title: "Edit Distance",
    difficulty: "Medium", leetcode: 72, pattern: "Two-string alignment DP",
    intuition: "dp[i][j] = min ops to convert word1[0..i-1] to word2[0..j-1]. Match → free (diagonal). Otherwise 1 + min of: INSERT (dp[i][j-1]), DELETE (dp[i-1][j]), REPLACE (dp[i-1][j-1]).",
    keyInsight: "The 3 operations map to 3 DP grid neighbors: left=insert, top=delete, diagonal=replace. This 2D recurrence appears in LCS, wildcard, regex — learn once, apply everywhere.",
    approach: "1) Init dp[i][0]=i, dp[0][j]=j. 2) Fill row by row. 3) Match → diagonal. Mismatch → 1 + min(3 neighbors).",
    complexity: "Time: O(M×N) | Space: O(M×N), optimizable to O(N)",
    code: `class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        
        for (int i = 0; i <= m; i++) dp[i][0] = i; // delete all
        for (int j = 0; j <= n; j++) dp[0][j] = j; // insert all
        
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1[i-1] == word2[j-1]) {
                    dp[i][j] = dp[i-1][j-1]; // match → free
                } else {
                    dp[i][j] = 1 + min({
                        dp[i-1][j],     // DELETE
                        dp[i][j-1],     // INSERT
                        dp[i-1][j-1]    // REPLACE
                    });
                }
            }
        }
        return dp[m][n];
    }
};`
  },
  {
    id: 6, section: "DP — String", title: "Longest Common Subsequence",
    difficulty: "Medium", leetcode: 1143, pattern: "Two-string matching DP",
    intuition: "dp[i][j] = LCS of text1[0..i-1] and text2[0..j-1]. Match → diagonal + 1. No match → max(skip from either). Foundation of many string DP problems.",
    keyInsight: "LCS is a building block: SCS = m+n-LCS. Edit dist (insert/delete only) = m+n-2*LCS. LPS = LCS(s, reverse(s)).",
    approach: "1) 2D dp of (m+1)×(n+1). 2) Match → dp[i-1][j-1]+1. No match → max(dp[i-1][j], dp[i][j-1]).",
    complexity: "Time: O(M×N) | Space: O(M×N)",
    code: `class Solution {
public:
    int longestCommonSubsequence(string text1, string text2) {
        int m = text1.size(), n = text2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
        
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1[i-1] == text2[j-1])
                    dp[i][j] = dp[i-1][j-1] + 1;     // MATCH: extend LCS
                else
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1]); // skip one char
            }
        }
        return dp[m][n];
    }
};`
  },
  {
    id: 7, section: "DP — String", title: "Longest Palindromic Subsequence",
    difficulty: "Medium", leetcode: 516, pattern: "Interval DP / Reverse LCS",
    intuition: "Two approaches: (1) LPS(s) = LCS(s, reverse(s)). (2) Interval DP: dp[i][j] = LPS in s[i..j]. Match endpoints → inner + 2. Else max of excluding either end.",
    keyInsight: "Interval DP fills by increasing gap (diagonally). Same pattern: Stone Game, Burst Balloons, Matrix Chain.",
    approach: "1) dp[i][i] = 1. 2) For gap 1..n-1: match → dp[i+1][j-1]+2. Else max(dp[i+1][j], dp[i][j-1]).",
    complexity: "Time: O(N²) | Space: O(N²)",
    code: `class Solution {
public:
    int longestPalindromeSubseq(string s) {
        int n = s.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        
        for (int i = 0; i < n; i++) dp[i][i] = 1; // single char
        
        // Fill by increasing gap (interval DP pattern)
        for (int gap = 1; gap < n; gap++) {
            for (int i = 0; i + gap < n; i++) {
                int j = i + gap;
                if (s[i] == s[j])
                    dp[i][j] = dp[i+1][j-1] + 2;  // wrap endpoints
                else
                    dp[i][j] = max(dp[i+1][j], dp[i][j-1]); // skip one
            }
        }
        return dp[0][n-1];
    }
};`
  },
  {
    id: 8, section: "DP — String", title: "Wildcard Matching",
    difficulty: "Hard", leetcode: 44, pattern: "Two-string pattern DP",
    intuition: "'?' matches one char. '*' matches any sequence. dp[i][j] = s[0..i-1] matches p[0..j-1]? For '*': match empty (dp[i][j-1]) OR extend to match s[i] (dp[i-1][j]).",
    keyInsight: "For '*': dp[i][j-1] = '*' matches empty. dp[i-1][j] = '*' consumes s[i] and could consume more. Same two-choice pattern in regex matching.",
    approach: "1) dp[0][0]=true. Leading *'s match empty. 2) '?' or char → diagonal. '*' → dp[i][j-1] || dp[i-1][j].",
    complexity: "Time: O(M×N) | Space: O(M×N)",
    code: `class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.size(), n = p.size();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        
        // Leading '*' patterns can match empty string
        for (int j = 1; j <= n; j++)
            if (p[j-1] == '*') dp[0][j] = dp[0][j-1];
        
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j-1] == '?' || p[j-1] == s[i-1])
                    dp[i][j] = dp[i-1][j-1];          // exact/single match
                else if (p[j-1] == '*')
                    dp[i][j] = dp[i][j-1] || dp[i-1][j]; // empty or extend
            }
        }
        return dp[m][n];
    }
};`
  },
  {
    id: 9, section: "DP — String", title: "Regular Expression Matching",
    difficulty: "Hard", leetcode: 10, pattern: "Regex DP with '.' and '*'",
    intuition: "'.' matches any char. '*' = zero or more of PRECEDING char. For '*': zero copies of p[j-2] → dp[i][j-2]. One+ copies → dp[i-1][j] if preceding matches s[i-1].",
    keyInsight: "'*' refers to the PRECEDING element. Always consider p[j-2]+p[j-1]='*' as a pair. Zero copies = skip pair. One+ copies = extend if chars match.",
    approach: "1) dp[0][0]=true. Handle a*b* patterns. 2) For '*': zero (dp[i][j-2]) + extend (dp[i-1][j] if match).",
    complexity: "Time: O(M×N) | Space: O(M×N)",
    code: `class Solution {
public:
    bool isMatch(string s, string p) {
        int m = s.size(), n = p.size();
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));
        dp[0][0] = true;
        
        // Handle patterns like a*, a*b*, a*b*c* matching empty
        for (int j = 2; j <= n; j++)
            if (p[j-1] == '*') dp[0][j] = dp[0][j-2];
        
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (p[j-1] == '.' || p[j-1] == s[i-1]) {
                    dp[i][j] = dp[i-1][j-1]; // direct match
                } else if (p[j-1] == '*') {
                    dp[i][j] = dp[i][j-2]; // ZERO copies of preceding
                    if (p[j-2] == '.' || p[j-2] == s[i-1])
                        dp[i][j] = dp[i][j] || dp[i-1][j]; // ONE+ copies
                }
            }
        }
        return dp[m][n];
    }
};`
  },
  {
    id: 10, section: "DP — String", title: "Word Break",
    difficulty: "Medium", leetcode: 139, pattern: "Prefix DP + dictionary",
    intuition: "dp[i] = can s[0..i-1] be segmented? For each i, try splits: if dp[j] true AND s[j..i-1] in dict → dp[i] = true. Use unordered_set for O(1) lookup.",
    keyInsight: "Optimization: only check substrings up to max word length. For Word Break II: backtrack with memo. BFS also works.",
    approach: "1) dp[0]=true. 2) For i 1..n: for j 0..i-1: if dp[j] && substr in dict → dp[i]=true, break.",
    complexity: "Time: O(N² × L) | Space: O(N)",
    code: `class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> dict(wordDict.begin(), wordDict.end());
        int n = s.size();
        vector<bool> dp(n + 1, false);
        dp[0] = true; // empty string breakable
        
        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (dp[j] && dict.count(s.substr(j, i - j))) {
                    dp[i] = true;
                    break; // found valid split
                }
            }
        }
        return dp[n];
    }
};`
  },

  // ═══ DP — INTERVAL / GAME ═══
  {
    id: 11, section: "DP — Interval / Game", title: "Stone Game / Predict the Winner",
    difficulty: "Medium", leetcode: 877, pattern: "Minimax Interval DP",
    intuition: "Two players pick from ends. dp[l][r] = max RELATIVE advantage for current player on [l..r]. Pick left: nums[l] - dp[l+1][r]. Pick right: nums[r] - dp[l][r-1]. Subtraction handles opponent's optimal play.",
    keyInsight: "Storing RELATIVE advantage (my - opponent's) instead of absolute scores is the key. After your pick, remaining game is from OPPONENT's perspective → hence subtraction.",
    approach: "1) dp[i][i]=nums[i]. 2) Increasing gap. 3) dp[l][r] = max(nums[l]-dp[l+1][r], nums[r]-dp[l][r-1]). 4) Win if dp[0][n-1]>=0.",
    complexity: "Time: O(N²) | Space: O(N²)",
    code: `class Solution {
public:
    bool predictTheWinner(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));
        
        for (int i = 0; i < n; i++) dp[i][i] = nums[i];
        
        for (int gap = 1; gap < n; gap++) {
            for (int l = 0; l + gap < n; l++) {
                int r = l + gap;
                dp[l][r] = max(
                    nums[l] - dp[l+1][r],  // pick left
                    nums[r] - dp[l][r-1]   // pick right
                );
            }
        }
        return dp[0][n-1] >= 0;
    }
};`
  },
  {
    id: 12, section: "DP — Interval / Game", title: "Burst Balloons",
    difficulty: "Hard", leetcode: 312, pattern: "Interval DP — last-to-burst",
    intuition: "Think which balloon to burst LAST in range (l,r) — not first. If k is last, left/right subproblems become INDEPENDENT. dp[l][r] = max coins from bursting all balloons between l and r (exclusive).",
    keyInsight: "Thinking about the LAST action makes subproblems independent — core interval DP insight. Same idea in Matrix Chain Multiplication.",
    approach: "1) Add boundary 1's. 2) dp[l][r] = max over k of dp[l][k]+dp[k][r]+nums[l]*nums[k]*nums[r].",
    complexity: "Time: O(N³) | Space: O(N²)",
    code: `class Solution {
public:
    int maxCoins(vector<int>& nums) {
        int n = nums.size();
        nums.insert(nums.begin(), 1);
        nums.push_back(1); // boundary balloons
        
        // dp[l][r] = max coins from bursting all in (l, r) exclusive
        vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));
        
        for (int len = 2; len <= n + 1; len++) {
            for (int l = 0; l + len <= n + 1; l++) {
                int r = l + len;
                for (int k = l + 1; k < r; k++) {
                    // k is LAST to burst → neighbors are l and r
                    dp[l][r] = max(dp[l][r],
                        dp[l][k] + dp[k][r] + nums[l] * nums[k] * nums[r]);
                }
            }
        }
        return dp[0][n + 1];
    }
};`
  },
  {
    id: 13, section: "DP — Interval / Game", title: "Can I Win",
    difficulty: "Medium", leetcode: 464, pattern: "Bitmask Game DP + Minimax",
    intuition: "Players pick 1..maxInt (no reuse) to reach target. Bitmask = used numbers. Win if ANY move leads to: immediate win (pick >= remaining) or opponent losing.",
    keyInsight: "Bitmask for game states when N ≤ 20. Memo key = bitmask (remaining is determined by used numbers). Always check if total can even reach target.",
    approach: "1) Check maxSum >= target. 2) Memo: mask → win/lose. 3) Try each unused num. Win if immediate or opponent loses.",
    complexity: "Time: O(N × 2^N) | Space: O(2^N)",
    code: `class Solution {
public:
    unordered_map<int, bool> memo;
    
    bool canIWin(int maxInt, int target) {
        if (target <= 0) return true;
        int total = maxInt * (maxInt + 1) / 2;
        if (total < target) return false;
        return solve(0, target, maxInt);
    }
    
    bool solve(int mask, int remaining, int maxInt) {
        if (memo.count(mask)) return memo[mask];
        
        for (int i = 1; i <= maxInt; i++) {
            if (mask & (1 << i)) continue; // used
            if (i >= remaining || !solve(mask | (1 << i), remaining - i, maxInt))
                return memo[mask] = true; // we win
        }
        return memo[mask] = false;
    }
};`
  },

  // ═══ DP — BITMASK ═══
  {
    id: 14, section: "DP — Bitmask", title: "Shortest Path Visiting All Nodes",
    difficulty: "Hard", leetcode: 847, pattern: "BFS + Bitmask state",
    intuition: "State = (node, visited_mask). BFS for shortest path. Start from ALL nodes. Goal: mask = all 1's. Graph BFS + bitmask = TSP for unweighted graphs.",
    keyInsight: "Start BFS from ALL nodes simultaneously when start is unknown. State space O(N × 2^N). Always useful for TSP-like problems.",
    approach: "1) Enqueue all (node, 1<<node, 0). 2) BFS. 3) new_mask = mask | (1<<neighbor). 4) Return when full mask.",
    complexity: "Time: O(N² × 2^N) | Space: O(N × 2^N)",
    code: `class Solution {
public:
    int shortestPathLength(vector<vector<int>>& graph) {
        int n = graph.size(), full = (1 << n) - 1;
        queue<tuple<int,int,int>> q; // {node, mask, dist}
        set<pair<int,int>> vis;
        
        for (int i = 0; i < n; i++) {
            q.push({i, 1 << i, 0});
            vis.insert({i, 1 << i});
        }
        
        while (!q.empty()) {
            auto [node, mask, dist] = q.front(); q.pop();
            if (mask == full) return dist;
            
            for (int nei : graph[node]) {
                int nm = mask | (1 << nei);
                if (!vis.count({nei, nm})) {
                    vis.insert({nei, nm});
                    q.push({nei, nm, dist + 1});
                }
            }
        }
        return -1;
    }
};`
  },

  // ═══ DP — SEQUENCE ═══
  {
    id: 15, section: "DP — Sequence", title: "Longest Increasing Subsequence",
    difficulty: "Medium", leetcode: 300, pattern: "Patience sorting / Binary search",
    intuition: "O(N log N): maintain tails[] where tails[k] = smallest tail of all LIS of length k+1. For each num, binary search for position. Extends or replaces.",
    keyInsight: "tails array doesn't store actual LIS. lower_bound gives insertion point. tails.size() = LIS length. To reconstruct: track parent pointers.",
    approach: "1) For each num: pos = lower_bound. 2) pos == end → extend. Else replace tails[pos]. 3) Answer = tails.size().",
    complexity: "Time: O(N log N) | Space: O(N)",
    code: `class Solution {
public:
    int lengthOfLIS(vector<int>& nums) {
        vector<int> tails; // smallest tail of LIS of each length
        
        for (int num : nums) {
            auto it = lower_bound(tails.begin(), tails.end(), num);
            if (it == tails.end())
                tails.push_back(num);  // extends LIS
            else
                *it = num;             // replace with smaller tail
        }
        return tails.size();
    }
};`
  },

  // ═══ GRAPH — BFS ═══
  {
    id: 16, section: "Graph — BFS", title: "Number of Islands",
    difficulty: "Medium", leetcode: 200, pattern: "Grid flood fill",
    intuition: "For each '1': BFS/DFS to mark all connected land. Each launch = one island. Modify in-place to avoid visited set. Mark BEFORE enqueue to prevent duplicates.",
    keyInsight: "Mark cells BEFORE enqueueing, not after popping. Common BFS mistake that causes TLE from duplicate entries.",
    approach: "1) Scan grid. 2) On '1': count++, BFS flood fill marking '0'. 3) Return count.",
    complexity: "Time: O(M×N) | Space: O(M×N)",
    code: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        int m = grid.size(), n = grid[0].size(), count = 0;
        int dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    queue<pair<int,int>> q;
                    grid[i][j] = '0'; // mark BEFORE enqueue!
                    q.push({i, j});
                    while (!q.empty()) {
                        auto [x, y] = q.front(); q.pop();
                        for (int d = 0; d < 4; d++) {
                            int nx = x+dx[d], ny = y+dy[d];
                            if (nx>=0 && nx<m && ny>=0 && ny<n && grid[nx][ny]=='1') {
                                grid[nx][ny] = '0';
                                q.push({nx, ny});
                            }
                        }
                    }
                }
            }
        }
        return count;
    }
};`
  },
  {
    id: 17, section: "Graph — BFS", title: "Rotting Oranges",
    difficulty: "Medium", leetcode: 994, pattern: "Multi-source BFS",
    intuition: "All rotten spread SIMULTANEOUSLY → enqueue ALL rotten first. BFS level-by-level. Each level = 1 minute. After BFS, if fresh remains → impossible.",
    keyInsight: "Multi-source BFS: enqueue ALL sources before BFS starts. Used in 01 Matrix, Walls and Gates, Shortest Bridge, Pacific Atlantic Water Flow.",
    approach: "1) Enqueue all rotten + count fresh. 2) Level-order BFS. 3) Return minutes or -1.",
    complexity: "Time: O(M×N) | Space: O(M×N)",
    code: `class Solution {
public:
    int orangesRotting(vector<vector<int>>& grid) {
        int m = grid.size(), n = grid[0].size(), fresh = 0;
        queue<pair<int,int>> q;
        
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                if (grid[i][j] == 2) q.push({i, j});
                else if (grid[i][j] == 1) fresh++;
            }
        
        if (!fresh) return 0;
        int mins = 0, dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
        
        while (!q.empty() && fresh > 0) {
            mins++;
            for (int sz = q.size(); sz > 0; sz--) {
                auto [x, y] = q.front(); q.pop();
                for (int d = 0; d < 4; d++) {
                    int nx = x+dx[d], ny = y+dy[d];
                    if (nx>=0 && nx<m && ny>=0 && ny<n && grid[nx][ny]==1) {
                        grid[nx][ny] = 2;
                        fresh--;
                        q.push({nx, ny});
                    }
                }
            }
        }
        return fresh == 0 ? mins : -1;
    }
};`
  },
  {
    id: 18, section: "Graph — BFS", title: "Word Ladder",
    difficulty: "Hard", leetcode: 127, pattern: "BFS shortest transformation",
    intuition: "Each word = node. Edge if 1-char different. BFS from begin. For each word, try 26 substitutions per position: O(26L) per word vs O(NL) all-pairs.",
    keyInsight: "Bidirectional BFS: BFS from both ends, meet in middle. O(b^(d/2)) vs O(b^d). Remove from set (acts as visited) instead of separate visited set.",
    approach: "1) WordSet. 2) BFS. 3) For each word, try all mutations. 4) Return steps when endWord found.",
    complexity: "Time: O(N × L × 26) | Space: O(N × L)",
    code: `class Solution {
public:
    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {
        unordered_set<string> words(wordList.begin(), wordList.end());
        if (!words.count(endWord)) return 0;
        
        queue<pair<string,int>> q;
        q.push({beginWord, 1});
        words.erase(beginWord);
        
        while (!q.empty()) {
            auto [word, steps] = q.front(); q.pop();
            for (int i = 0; i < word.size(); i++) {
                char orig = word[i];
                for (char c = 'a'; c <= 'z'; c++) {
                    word[i] = c;
                    if (word == endWord) return steps + 1;
                    if (words.count(word)) {
                        words.erase(word); // mark visited
                        q.push({word, steps + 1});
                    }
                }
                word[i] = orig;
            }
        }
        return 0;
    }
};`
  },

  // ═══ GRAPH — TOPO SORT ═══
  {
    id: 19, section: "Graph — Topo Sort", title: "Course Schedule I & II",
    difficulty: "Medium", leetcode: 207, pattern: "Kahn's BFS Topo Sort",
    intuition: "DAG: cycle → impossible. Kahn's: start from 0-indegree nodes, process, decrement neighbors. processed < total → cycle. Processing order IS topological order.",
    keyInsight: "Kahn's = cycle detection + ordering. DFS topo uses finish-time (reverse post-order). Kahn's is usually cleaner for interviews.",
    approach: "1) Build graph + indegree. 2) Enqueue 0-indegree. 3) BFS: process → decrement → enqueue. 4) Check count.",
    complexity: "Time: O(V + E) | Space: O(V + E)",
    code: `class Solution {
public:
    // LC 207: Can finish?
    bool canFinish(int n, vector<vector<int>>& prereqs) {
        vector<vector<int>> g(n);
        vector<int> indeg(n, 0);
        for (auto& p : prereqs) { g[p[1]].push_back(p[0]); indeg[p[0]]++; }
        
        queue<int> q;
        for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
        
        int cnt = 0;
        while (!q.empty()) {
            int u = q.front(); q.pop(); cnt++;
            for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
        }
        return cnt == n;
    }
    
    // LC 210: Return order
    vector<int> findOrder(int n, vector<vector<int>>& prereqs) {
        vector<vector<int>> g(n);
        vector<int> indeg(n, 0);
        for (auto& p : prereqs) { g[p[1]].push_back(p[0]); indeg[p[0]]++; }
        
        queue<int> q;
        for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
        
        vector<int> order;
        while (!q.empty()) {
            int u = q.front(); q.pop();
            order.push_back(u);
            for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
        }
        return order.size() == n ? order : vector<int>{};
    }
};`
  },

  // ═══ GRAPH — SHORTEST PATH ═══
  {
    id: 20, section: "Graph — Shortest Path", title: "Dijkstra's Algorithm",
    difficulty: "Medium", leetcode: 743, pattern: "Greedy + Min-Heap",
    intuition: "NON-NEGATIVE weights. Min-heap: expand closest unfinalized node. Once popped = FINAL distance. Skip stale entries (d > dist[u]). Fails with negative edges.",
    keyInsight: "The 'skip stale' check (d > dist[u]) is critical. Without it, same node processed multiple times. This is what makes Dijkstra O(E log V) not O(VE).",
    approach: "1) dist[src]=0. 2) Push (0,src). 3) Pop, skip stale. 4) Relax neighbors, push improvements.",
    complexity: "Time: O(E log V) | Space: O(V + E)",
    code: `class Solution {
public:
    vector<int> dijkstra(int n, vector<vector<pair<int,int>>>& g, int src) {
        vector<int> dist(n, INT_MAX);
        dist[src] = 0;
        priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
        pq.push({0, src});
        
        while (!pq.empty()) {
            auto [d, u] = pq.top(); pq.pop();
            if (d > dist[u]) continue; // *** SKIP STALE ***
            
            for (auto [v, w] : g[u]) {
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.push({dist[v], v});
                }
            }
        }
        return dist;
    }
    
    // Network Delay Time (LC 743)
    int networkDelayTime(vector<vector<int>>& times, int n, int k) {
        vector<vector<pair<int,int>>> g(n + 1);
        for (auto& t : times) g[t[0]].push_back({t[1], t[2]});
        auto dist = dijkstra(n + 1, g, k);
        int ans = *max_element(dist.begin() + 1, dist.begin() + n + 1);
        return ans == INT_MAX ? -1 : ans;
    }
};`
  },
  {
    id: 21, section: "Graph — Shortest Path", title: "Bellman-Ford (K Stops)",
    difficulty: "Medium", leetcode: 787, pattern: "Relax all edges V-1 times",
    intuition: "Handles NEGATIVE edges. Relax all edges V-1 times. For K-stops: COPY dist before each round to prevent cascading. Vth iteration improving → negative cycle.",
    keyInsight: "COPY dist before each round for K-stops variant. Without copy, a single round chains multiple edges, violating the K constraint.",
    approach: "1) dist[src]=0. 2) K+1 rounds: snapshot + relax all edges. 3) Return dist[dst].",
    complexity: "Time: O(V × E) | Space: O(V)",
    code: `class Solution {
public:
    int findCheapestPrice(int n, vector<vector<int>>& flights, int src, int dst, int k) {
        vector<int> dist(n, INT_MAX);
        dist[src] = 0;
        
        for (int i = 0; i <= k; i++) {
            vector<int> temp(dist); // SNAPSHOT prevents cascading
            for (auto& f : flights) {
                if (dist[f[0]] != INT_MAX && dist[f[0]] + f[2] < temp[f[1]])
                    temp[f[1]] = dist[f[0]] + f[2];
            }
            dist = temp;
        }
        return dist[dst] == INT_MAX ? -1 : dist[dst];
    }
};`
  },

  // ═══ GRAPH — UNION FIND ═══
  {
    id: 22, section: "Graph — Union Find", title: "Union Find Template",
    difficulty: "Medium", leetcode: 547, pattern: "DSU with path compression + rank",
    intuition: "PATH COMPRESSION: find() points directly to root. UNION BY RANK: smaller under larger. Together: near O(1) amortized. unite() returns false → already connected → cycle!",
    keyInsight: "unite() returning false = cycle in undirected graph (Redundant Connection). Also core of Kruskal's MST. Track component count for connectivity.",
    approach: "1) parent[i]=i, rank[i]=0. 2) find: path compression. 3) unite: union by rank.",
    complexity: "Time: O(α(N)) ≈ O(1) amortized | Space: O(N)",
    code: `class UnionFind {
public:
    vector<int> parent, rank_;
    int components;
    
    UnionFind(int n) : parent(n), rank_(n, 0), components(n) {
        iota(parent.begin(), parent.end(), 0);
    }
    
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // path compression
        return parent[x];
    }
    
    bool unite(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false; // already connected!
        if (rank_[rx] < rank_[ry]) swap(rx, ry);
        parent[ry] = rx;
        if (rank_[rx] == rank_[ry]) rank_[rx]++;
        components--;
        return true;
    }
};

// LC 547: Number of Provinces
int findCircleNum(vector<vector<int>>& M) {
    int n = M.size();
    UnionFind uf(n);
    for (int i = 0; i < n; i++)
        for (int j = i+1; j < n; j++)
            if (M[i][j]) uf.unite(i, j);
    return uf.components;
}

// LC 684: Redundant Connection
vector<int> findRedundantConnection(vector<vector<int>>& edges) {
    UnionFind uf(edges.size() + 1);
    for (auto& e : edges)
        if (!uf.unite(e[0], e[1])) return e; // cycle edge!
    return {};
}`
  },

  // ═══ GRAPH — MST ═══
  {
    id: 23, section: "Graph — MST", title: "Kruskal's MST",
    difficulty: "Medium", leetcode: 1584, pattern: "Sort edges + Union Find",
    intuition: "Sort edges by weight. Greedily add cheapest non-cycle-creating edge (Union-Find). Stop at V-1 edges. Kruskal = sort + UF. Prim = heap growth from one node.",
    keyInsight: "Kruskal is simpler to code (sort + UF). Prim better for dense graphs. Both produce same MST weight.",
    approach: "1) Sort edges. 2) For each: if UF.unite succeeds → add to MST. 3) Stop at V-1.",
    complexity: "Time: O(E log E) | Space: O(V)",
    code: `int kruskalMST(int n, vector<tuple<int,int,int>>& edges) {
    sort(edges.begin(), edges.end()); // sort by weight
    UnionFind uf(n);
    int cost = 0, used = 0;
    
    for (auto& [w, u, v] : edges) {
        if (uf.unite(u, v)) { // no cycle → add
            cost += w;
            if (++used == n - 1) break; // MST complete
        }
    }
    return cost;
}

// LC 1584: Min Cost to Connect All Points
int minCostConnectPoints(vector<vector<int>>& pts) {
    int n = pts.size();
    vector<tuple<int,int,int>> edges;
    for (int i = 0; i < n; i++)
        for (int j = i+1; j < n; j++)
            edges.push_back({abs(pts[i][0]-pts[j][0])+abs(pts[i][1]-pts[j][1]), i, j});
    return kruskalMST(n, edges);
}`
  },

  // ═══ GRAPH — TARJAN ═══
  {
    id: 24, section: "Graph — Tarjan", title: "Critical Connections (Bridges)",
    difficulty: "Hard", leetcode: 1192, pattern: "Tarjan's bridge-finding DFS",
    intuition: "Edge (u,v) is bridge if removing disconnects graph. DFS with disc[] and low[]. low[v] > disc[u] → (u,v) is bridge. low[v] >= disc[u] → u is articulation point.",
    keyInsight: "low[v] > disc[u] → bridge. low[v] >= disc[u] → articulation point. Both in single DFS pass. Back edges update low values.",
    approach: "1) DFS with timer. 2) Tree edge: update low, check bridge. 3) Back edge: update low.",
    complexity: "Time: O(V + E) | Space: O(V + E)",
    code: `class Solution {
public:
    vector<vector<int>> res;
    vector<int> disc, low;
    int timer = 0;
    
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& conn) {
        vector<vector<int>> g(n);
        for (auto& c : conn) { g[c[0]].push_back(c[1]); g[c[1]].push_back(c[0]); }
        disc.assign(n, -1); low.assign(n, -1);
        dfs(g, 0, -1);
        return res;
    }
    
    void dfs(vector<vector<int>>& g, int u, int par) {
        disc[u] = low[u] = timer++;
        for (int v : g[u]) {
            if (v == par) continue;
            if (disc[v] == -1) {
                dfs(g, v, u);
                low[u] = min(low[u], low[v]);
                if (low[v] > disc[u]) res.push_back({u, v}); // BRIDGE
            } else {
                low[u] = min(low[u], disc[v]); // back edge
            }
        }
    }
};`
  },

  // ═══ SLIDING WINDOW ═══
  {
    id: 25, section: "Sliding Window", title: "Longest Substring Without Repeating",
    difficulty: "Medium", leetcode: 3, pattern: "Variable window + hashmap",
    intuition: "Expand right. On duplicate within window, jump left past previous occurrence. Track last index per char. Window always has unique chars.",
    keyInsight: "Left pointer ONLY moves forward → O(N) total. Check last_seen >= left to ensure previous occurrence is within window.",
    approach: "1) Map char→index. 2) For each right: if seen within window, move left. Update map. Track max.",
    complexity: "Time: O(N) | Space: O(26)",
    code: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_map<char, int> last;
        int left = 0, ans = 0;
        
        for (int right = 0; right < s.size(); right++) {
            if (last.count(s[right]) && last[s[right]] >= left)
                left = last[s[right]] + 1; // shrink past dup
            last[s[right]] = right;
            ans = max(ans, right - left + 1);
        }
        return ans;
    }
};`
  },
  {
    id: 26, section: "Sliding Window", title: "Minimum Window Substring",
    difficulty: "Hard", leetcode: 76, pattern: "Shrinkable window + freq count",
    intuition: "Expand right until all chars of t satisfied. Shrink left to minimize. Track 'have' vs 'required' unique char counts. Only update have at exact threshold.",
    keyInsight: "'have' tracks unique chars meeting frequency. Increment/decrement only at threshold → avoids rechecking all frequencies each step.",
    approach: "1) need map from t. 2) Expand right, track window freq. 3) While valid: update result, shrink left.",
    complexity: "Time: O(N) | Space: O(|charset|)",
    code: `class Solution {
public:
    string minWindow(string s, string t) {
        unordered_map<char,int> need, win;
        for (char c : t) need[c]++;
        
        int have = 0, req = need.size();
        int left = 0, minLen = INT_MAX, minStart = 0;
        
        for (int r = 0; r < s.size(); r++) {
            win[s[r]]++;
            if (need.count(s[r]) && win[s[r]] == need[s[r]]) have++;
            
            while (have == req) {
                if (r - left + 1 < minLen) { minLen = r-left+1; minStart = left; }
                win[s[left]]--;
                if (need.count(s[left]) && win[s[left]] < need[s[left]]) have--;
                left++;
            }
        }
        return minLen == INT_MAX ? "" : s.substr(minStart, minLen);
    }
};`
  },
  {
    id: 27, section: "Sliding Window", title: "Sliding Window Maximum",
    difficulty: "Hard", leetcode: 239, pattern: "Monotonic deque",
    intuition: "Deque of indices, monotonic DECREASING values. Front = window max. Remove expired front. Remove smaller from back. O(1) amortized per element.",
    keyInsight: "Deque stores INDICES to check window bounds. Values are decreasing. Each element enters/exits deque at most once → O(N) total.",
    approach: "1) Remove expired front. 2) Remove smaller back. 3) Append. 4) Record front if window complete.",
    complexity: "Time: O(N) | Space: O(K)",
    code: `class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq; // indices, decreasing values
        vector<int> res;
        
        for (int i = 0; i < nums.size(); i++) {
            while (!dq.empty() && dq.front() < i - k + 1) dq.pop_front();
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
            dq.push_back(i);
            if (i >= k - 1) res.push_back(nums[dq.front()]);
        }
        return res;
    }
};`
  },

  // ═══ MONOTONIC STACK ═══
  {
    id: 28, section: "Monotonic Stack", title: "Largest Rectangle in Histogram",
    difficulty: "Hard", leetcode: 84, pattern: "Monotonic increasing stack",
    intuition: "Monotonic increasing stack of indices. When popping bar h (taller than current): left boundary = new top, right boundary = current i. Width × height = area. Sentinel 0 at end flushes all.",
    keyInsight: "Sentinel trick (append 0) forces cleanup. This is building block for Maximal Rectangle (LC 85): run histogram on each row.",
    approach: "1) Append sentinel. 2) Pop while taller. 3) Width = i - top - 1. 4) Track max area.",
    complexity: "Time: O(N) | Space: O(N)",
    code: `class Solution {
public:
    int largestRectangleArea(vector<int>& h) {
        stack<int> stk;
        h.push_back(0); // sentinel
        int ans = 0;
        
        for (int i = 0; i < h.size(); i++) {
            while (!stk.empty() && h[stk.top()] > h[i]) {
                int height = h[stk.top()]; stk.pop();
                int width = stk.empty() ? i : i - stk.top() - 1;
                ans = max(ans, height * width);
            }
            stk.push(i);
        }
        h.pop_back();
        return ans;
    }
};`
  },
  {
    id: 29, section: "Monotonic Stack", title: "Trapping Rain Water",
    difficulty: "Hard", leetcode: 42, pattern: "Two pointers",
    intuition: "Water at i = min(maxLeft, maxRight) - height[i]. Two pointers: process smaller side. Smaller side's max definitively bounds water there.",
    keyInsight: "Move smaller side because water is bounded by the LOWER wall. The other side is at least as tall, so its exact value doesn't matter yet.",
    approach: "1) L=0 R=n-1. 2) Process smaller side. 3) If height >= max: update. Else: add water.",
    complexity: "Time: O(N) | Space: O(1)",
    code: `class Solution {
public:
    int trap(vector<int>& h) {
        int l = 0, r = h.size()-1, lMax = 0, rMax = 0, water = 0;
        
        while (l < r) {
            if (h[l] < h[r]) {
                h[l] >= lMax ? lMax = h[l] : water += lMax - h[l];
                l++;
            } else {
                h[r] >= rMax ? rMax = h[r] : water += rMax - h[r];
                r--;
            }
        }
        return water;
    }
};`
  },

  // ═══ PREFIX SUMS ═══
  {
    id: 30, section: "Prefix Sums", title: "Subarray Sum Equals K",
    difficulty: "Medium", leetcode: 560, pattern: "Prefix sum + hashmap",
    intuition: "prefix[j] - prefix[i] = k → subarray (i,j] sums to k. Count prefix[i] = prefix[j]-k using hashmap. O(N).",
    keyInsight: "Init map {0:1} for subarrays starting at index 0. Same pattern for: divisible by K (mod), longest subarray with sum K, XOR subarrays.",
    approach: "1) Map {0:1}. 2) For each: currSum += num. count += map[currSum-k]. map[currSum]++.",
    complexity: "Time: O(N) | Space: O(N)",
    code: `class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int,int> prefCnt;
        prefCnt[0] = 1; // empty prefix sum 0
        int curr = 0, count = 0;
        
        for (int num : nums) {
            curr += num;
            count += prefCnt[curr - k]; // subarrays ending here with sum k
            prefCnt[curr]++;
        }
        return count;
    }
};`
  },
  {
    id: 31, section: "Prefix Sums", title: "Product of Array Except Self",
    difficulty: "Medium", leetcode: 238, pattern: "Left-right prefix/suffix",
    intuition: "result[i] = leftProduct × rightProduct. Left pass: accumulate prefix. Right pass: multiply suffix. No division. O(1) extra space.",
    keyInsight: "Left-right decomposition pattern appears in: rain water, stock buy/sell, max product subarray. Two-pass prefix/suffix when you need info from both sides.",
    approach: "1) Left pass: result[i] = product of [0..i-1]. 2) Right pass: multiply by product of [i+1..n-1].",
    complexity: "Time: O(N) | Space: O(1) extra",
    code: `class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        int n = nums.size();
        vector<int> res(n, 1);
        
        int left = 1;
        for (int i = 0; i < n; i++) { res[i] = left; left *= nums[i]; }
        
        int right = 1;
        for (int i = n-1; i >= 0; i--) { res[i] *= right; right *= nums[i]; }
        
        return res;
    }
};`
  },

  // ═══ GREEDY ═══
  {
    id: 32, section: "Greedy", title: "Jump Game I & II",
    difficulty: "Medium", leetcode: 55, pattern: "Greedy reachability",
    intuition: "I: Track maxReach. If i > maxReach → stuck. II: BFS-like greedy with currentEnd and farthest boundaries. Jump when i reaches currentEnd.",
    keyInsight: "Jump Game II = BFS where each level = one jump. currentEnd = BFS level boundary. farthest = next level boundary.",
    approach: "I: One pass, update maxReach. II: Track boundaries, jump at currentEnd.",
    complexity: "Time: O(N) | Space: O(1)",
    code: `class Solution {
public:
    bool canJump(vector<int>& nums) {
        int maxReach = 0;
        for (int i = 0; i < nums.size(); i++) {
            if (i > maxReach) return false;
            maxReach = max(maxReach, i + nums[i]);
        }
        return true;
    }
    
    int jump(vector<int>& nums) {
        int jumps = 0, curEnd = 0, farthest = 0;
        for (int i = 0; i < (int)nums.size()-1; i++) {
            farthest = max(farthest, i + nums[i]);
            if (i == curEnd) { jumps++; curEnd = farthest; }
        }
        return jumps;
    }
};`
  },
  {
    id: 33, section: "Greedy", title: "Merge Intervals",
    difficulty: "Medium", leetcode: 56, pattern: "Sort + merge",
    intuition: "Sort by start. Merge if overlap (current.start <= last.end). Extend end. Only compare with last merged interval after sorting.",
    keyInsight: "After sorting by start, only check overlap with LAST merged (not all previous). O(N) scan after O(N log N) sort.",
    approach: "1) Sort by start. 2) For each: overlap → extend. No overlap → push new.",
    complexity: "Time: O(N log N) | Space: O(N)",
    code: `class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> res;
        
        for (auto& iv : intervals) {
            if (res.empty() || iv[0] > res.back()[1])
                res.push_back(iv);
            else
                res.back()[1] = max(res.back()[1], iv[1]);
        }
        return res;
    }
};`
  },
  {
    id: 34, section: "Greedy", title: "Task Scheduler",
    difficulty: "Medium", leetcode: 621, pattern: "Frequency greedy",
    intuition: "Most frequent task creates the frame. (maxFreq-1) chunks of (n+1) width + count of max-freq tasks. If enough diverse tasks → no idle.",
    keyInsight: "Visualize: [A _ _ _][A _ _ _][A B]. Chunks = maxFreq-1, width = n+1. Final chunk = maxCount. Answer = max(formula, total).",
    approach: "1) Count freq, find maxFreq and maxCount. 2) result = (maxFreq-1)*(n+1)+maxCount. 3) max(result, total).",
    complexity: "Time: O(N) | Space: O(1)",
    code: `class Solution {
public:
    int leastInterval(vector<char>& tasks, int n) {
        int freq[26] = {};
        for (char t : tasks) freq[t-'A']++;
        int maxF = *max_element(freq, freq+26);
        int maxCnt = count(freq, freq+26, maxF);
        return max((int)tasks.size(), (maxF-1)*(n+1) + maxCnt);
    }
};`
  },

  // ═══ TWO POINTERS / BINARY SEARCH ═══
  {
    id: 35, section: "Two Pointers", title: "3Sum",
    difficulty: "Medium", leetcode: 15, pattern: "Sort + fix + two pointers",
    intuition: "Sort. Fix one num (i). Two pointers find pair summing to -nums[i]. Skip duplicates at all 3 levels. Early break if nums[i] > 0.",
    keyInsight: "Skip duplicates: for i (before processing), for left/right (after finding match). Extends to 4Sum with extra loop.",
    approach: "1) Sort. 2) Fix i, skip dups. 3) Two pointers. 4) Skip dup pairs after match.",
    complexity: "Time: O(N²) | Space: O(1)",
    code: `class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        
        for (int i = 0; i < (int)nums.size()-2; i++) {
            if (i > 0 && nums[i] == nums[i-1]) continue;
            if (nums[i] > 0) break;
            
            int l = i+1, r = nums.size()-1, target = -nums[i];
            while (l < r) {
                int sum = nums[l] + nums[r];
                if (sum < target) l++;
                else if (sum > target) r--;
                else {
                    res.push_back({nums[i], nums[l], nums[r]});
                    while (l < r && nums[l]==nums[l+1]) l++;
                    while (l < r && nums[r]==nums[r-1]) r--;
                    l++; r--;
                }
            }
        }
        return res;
    }
};`
  },
  {
    id: 36, section: "Binary Search", title: "Search in Rotated Sorted Array",
    difficulty: "Medium", leetcode: 33, pattern: "Modified binary search",
    intuition: "One half always sorted. Identify which: nums[left] <= nums[mid] → left sorted. Check if target in sorted half → narrow. Handles rotation elegantly.",
    keyInsight: "Key: identify sorted half FIRST, then check if target lies within it. For duplicates (LC 81): nums[left]==nums[mid] → left++ to break tie.",
    approach: "1) Binary search. 2) Identify sorted half. 3) Check if target in sorted half → narrow.",
    complexity: "Time: O(log N) | Space: O(1)",
    code: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = nums.size()-1;
        while (l <= r) {
            int m = l + (r-l)/2;
            if (nums[m] == target) return m;
            
            if (nums[l] <= nums[m]) { // LEFT sorted
                if (nums[l] <= target && target < nums[m]) r = m-1;
                else l = m+1;
            } else { // RIGHT sorted
                if (nums[m] < target && target <= nums[r]) l = m+1;
                else r = m-1;
            }
        }
        return -1;
    }
};`
  },

  // ═══ HEAP ═══
  {
    id: 37, section: "Heap", title: "Find Median from Data Stream",
    difficulty: "Hard", leetcode: 295, pattern: "Two heaps (max + min)",
    intuition: "Max-heap (small half) + min-heap (large half). Median = max-heap top (odd) or avg of both tops (even). Balance sizes after insert.",
    keyInsight: "Always add to max-heap first, then rebalance. C++ priority_queue is max-heap by default. Use greater<> for min-heap.",
    approach: "1) Push to small. 2) Move small's top to large. 3) Rebalance sizes.",
    complexity: "Time: O(log N) per add | Space: O(N)",
    code: `class MedianFinder {
public:
    priority_queue<int> small; // max-heap
    priority_queue<int, vector<int>, greater<int>> large; // min-heap
    
    void addNum(int num) {
        small.push(num);
        large.push(small.top()); small.pop();
        if (small.size() < large.size()) {
            small.push(large.top()); large.pop();
        }
    }
    
    double findMedian() {
        return small.size() > large.size() ? small.top()
             : (small.top() + large.top()) / 2.0;
    }
};`
  },
  {
    id: 38, section: "Heap", title: "Merge K Sorted Lists",
    difficulty: "Hard", leetcode: 23, pattern: "Min-heap of list heads",
    intuition: "Push all heads into min-heap. Pop smallest, append, push its next. Heap ≤ K elements. Each of N total enters/exits once → O(N log K).",
    keyInsight: "Generalizes merge sort's merge step to K lists. Heap approach simpler than divide-and-conquer for interviews.",
    approach: "1) Push non-null heads. 2) Pop min, append. 3) Push min's next. 4) Repeat.",
    complexity: "Time: O(N log K) | Space: O(K)",
    code: `class Solution {
public:
    ListNode* mergeKLists(vector<ListNode*>& lists) {
        auto cmp = [](ListNode* a, ListNode* b) { return a->val > b->val; };
        priority_queue<ListNode*, vector<ListNode*>, decltype(cmp)> pq(cmp);
        
        for (auto* l : lists) if (l) pq.push(l);
        
        ListNode dummy(0), *cur = &dummy;
        while (!pq.empty()) {
            cur->next = pq.top(); pq.pop();
            cur = cur->next;
            if (cur->next) pq.push(cur->next);
        }
        return dummy.next;
    }
};`
  },

  // ═══ TREES ═══
  {
    id: 39, section: "Trees", title: "Binary Tree Maximum Path Sum",
    difficulty: "Hard", leetcode: 124, pattern: "DFS with global max",
    intuition: "At each node: THROUGH = val + leftGain + rightGain (update global). RETURN to parent = val + max(left, right) (single branch only). Clamp gains at 0.",
    keyInsight: "'Through' uses BOTH branches (global update). 'Return' uses ONE branch (for parent). Same logic for tree diameter.",
    approach: "1) DFS returns single-branch gain. 2) At each node: update global with both branches. 3) Return one branch.",
    complexity: "Time: O(N) | Space: O(H)",
    code: `class Solution {
public:
    int ans = INT_MIN;
    
    int maxPathSum(TreeNode* root) { dfs(root); return ans; }
    
    int dfs(TreeNode* node) {
        if (!node) return 0;
        int L = max(dfs(node->left), 0);  // clamp negative
        int R = max(dfs(node->right), 0);
        ans = max(ans, node->val + L + R); // path THROUGH node
        return node->val + max(L, R);       // one branch to parent
    }
};`
  },
  {
    id: 40, section: "Trees", title: "LCA + Serialize/Deserialize",
    difficulty: "Medium", leetcode: 236, pattern: "Recursive DFS / Preorder",
    intuition: "LCA: if both children return non-null → current is LCA. BST: follow BST property. Serialize: preorder with null markers. Deserialize: read in order, build recursively.",
    keyInsight: "Generic LCA: first node found when p,q are in different subtrees. BST LCA: just follow values. Serialize needs null markers for unique reconstruction.",
    approach: "LCA: postorder, return first split. Serialize: preorder + 'N' for nulls.",
    complexity: "Time: O(N) | Space: O(H)",
    code: `// LCA of Binary Tree (LC 236)
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {
    if (!root || root == p || root == q) return root;
    auto* L = lowestCommonAncestor(root->left, p, q);
    auto* R = lowestCommonAncestor(root->right, p, q);
    if (L && R) return root; // split
    return L ? L : R;
}

// Serialize/Deserialize (LC 297)
class Codec {
public:
    string serialize(TreeNode* root) {
        if (!root) return "N";
        return to_string(root->val) + "," + serialize(root->left) + "," + serialize(root->right);
    }
    TreeNode* deserialize(string data) {
        istringstream ss(data); return build(ss);
    }
    TreeNode* build(istringstream& ss) {
        string tok; getline(ss, tok, ',');
        if (tok == "N") return nullptr;
        auto* node = new TreeNode(stoi(tok));
        node->left = build(ss); node->right = build(ss);
        return node;
    }
};`
  },

  // ═══ BACKTRACKING ═══
  {
    id: 41, section: "Backtracking", title: "Combination Sum + N-Queens",
    difficulty: "Hard", leetcode: 39, pattern: "Choose-recurse-unchoose",
    intuition: "Combo Sum: start from same index for reuse (i+1 for no reuse). N-Queens: row by row, track cols and diagonals with sets. (row-col) for \\\\ diagonal, (row+col) for / diagonal.",
    keyInsight: "start index = combos. swap = perms. Sort + skip = dedup. N-Queens diagonal trick: same \\\\ diagonal = same (row-col), same / diagonal = same (row+col).",
    approach: "Combo: sort, prune, start idx. N-Queens: place row by row, check 3 constraints.",
    complexity: "Combo: O(N^(T/M)) | N-Queens: O(N!)",
    code: `// Combination Sum (LC 39)
class Solution {
public:
    vector<vector<int>> res;
    vector<vector<int>> combinationSum(vector<int>& cands, int target) {
        sort(cands.begin(), cands.end());
        vector<int> path;
        bt(cands, target, 0, path);
        return res;
    }
    void bt(vector<int>& c, int rem, int start, vector<int>& path) {
        if (rem == 0) { res.push_back(path); return; }
        for (int i = start; i < c.size() && c[i] <= rem; i++) {
            path.push_back(c[i]);
            bt(c, rem - c[i], i, path); // i not i+1: allow reuse
            path.pop_back();
        }
    }
};

// N-Queens (LC 51)
class NQueens {
public:
    vector<vector<string>> res;
    vector<vector<string>> solveNQueens(int n) {
        vector<string> board(n, string(n, '.'));
        unordered_set<int> cols, d1, d2;
        solve(board, 0, n, cols, d1, d2);
        return res;
    }
    void solve(vector<string>& b, int row, int n,
               unordered_set<int>& cols, unordered_set<int>& d1, unordered_set<int>& d2) {
        if (row == n) { res.push_back(b); return; }
        for (int c = 0; c < n; c++) {
            if (cols.count(c) || d1.count(row-c) || d2.count(row+c)) continue;
            b[row][c] = 'Q'; cols.insert(c); d1.insert(row-c); d2.insert(row+c);
            solve(b, row+1, n, cols, d1, d2);
            b[row][c] = '.'; cols.erase(c); d1.erase(row-c); d2.erase(row+c);
        }
    }
};`
  },

  // ═══ LINKED LIST ═══
  {
    id: 42, section: "Linked List", title: "Reverse + LRU Cache",
    difficulty: "Medium", leetcode: 206, pattern: "Pointer reversal + DLL + HashMap",
    intuition: "Reverse: 3 pointers (prev, curr, next). LRU: HashMap for O(1) lookup + DLL for O(1) removal/insertion. Sentinel head/tail eliminate edge cases.",
    keyInsight: "DLL + HashMap = O(1) for all LRU operations. Sentinel nodes eliminate null checks. Most frequent linked list interview combination.",
    approach: "Reverse: save next, reverse, advance. LRU: get→move front. put→add+evict if needed.",
    complexity: "Reverse: O(N)/O(1) | LRU: O(1) per op",
    code: `// Reverse Linked List
ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr, *curr = head;
    while (curr) {
        auto* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}

// LRU Cache (LC 146)
class LRUCache {
    struct Node { int k, v; Node *p, *n; };
    int cap; unordered_map<int, Node*> m;
    Node *head, *tail;
    
    void remove(Node* nd) { nd->p->n = nd->n; nd->n->p = nd->p; }
    void addFront(Node* nd) {
        nd->n = head->n; nd->p = head;
        head->n->p = nd; head->n = nd;
    }
public:
    LRUCache(int capacity) : cap(capacity) {
        head = new Node(); tail = new Node();
        head->n = tail; tail->p = head;
    }
    int get(int key) {
        if (!m.count(key)) return -1;
        auto* nd = m[key];
        remove(nd); addFront(nd);
        return nd->v;
    }
    void put(int key, int val) {
        if (m.count(key)) { auto* nd = m[key]; nd->v = val; remove(nd); addFront(nd); return; }
        auto* nd = new Node{key, val, nullptr, nullptr};
        m[key] = nd; addFront(nd);
        if (m.size() > cap) {
            auto* lru = tail->p; remove(lru);
            m.erase(lru->k); delete lru;
        }
    }
};`
  },

  // ═══ TRIE ═══
  {
    id: 43, section: "Trie", title: "Implement Trie",
    difficulty: "Medium", leetcode: 208, pattern: "Prefix tree",
    intuition: "Node with children[26] + isEnd flag. Insert: create path. Search: traverse, check isEnd. StartsWith: traverse, check existence. O(L) per operation.",
    keyInsight: "Trie + grid backtracking = Word Search II (LC 212). Build trie from words, DFS from each cell following trie edges. Much faster than checking each word individually.",
    approach: "1) children[26] + isEnd. 2) Insert: walk/create. 3) Search/StartsWith: walk.",
    complexity: "Time: O(L) per op | Space: O(total chars)",
    code: `class Trie {
    struct Node { Node* ch[26] = {}; bool end = false; };
    Node* root;
public:
    Trie() : root(new Node()) {}
    
    void insert(string word) {
        auto* n = root;
        for (char c : word) {
            if (!n->ch[c-'a']) n->ch[c-'a'] = new Node();
            n = n->ch[c-'a'];
        }
        n->end = true;
    }
    
    bool search(string word) {
        auto* n = find(word);
        return n && n->end;
    }
    
    bool startsWith(string prefix) { return find(prefix) != nullptr; }
    
private:
    Node* find(string& s) {
        auto* n = root;
        for (char c : s) {
            if (!n->ch[c-'a']) return nullptr;
            n = n->ch[c-'a'];
        }
        return n;
    }
};`
  },
];

const CHEATSHEET = [
  { pattern: "0/1 Knapsack", when: "Pick/skip with capacity", template: "dp[s] |= dp[s-num]  (REVERSE loop)", tip: "Reverse = 0/1. Forward = unbounded." },
  { pattern: "Two-String DP", when: "Edit dist, LCS, matching", template: "dp[i][j] from diagonal, top, left neighbors", tip: "Match → diagonal. Mismatch → min/max of 3." },
  { pattern: "Interval DP", when: "Ranges, palindromes, games", template: "dp[l][r] from dp[l+1][r], dp[l][r-1]", tip: "Fill by increasing gap. Think LAST action." },
  { pattern: "Bitmask DP", when: "N ≤ 20, subsets, TSP", template: "dp[mask | (1<<i)]", tip: "2^20 ≈ 1M. Combine with BFS for graph+mask." },
  { pattern: "BFS", when: "Shortest unweighted, spreading", template: "queue + visited + level processing", tip: "Multi-source: enqueue ALL first. Mark BEFORE enqueue." },
  { pattern: "Dijkstra", when: "Shortest, non-negative weights", template: "min-heap, skip if d > dist[u]", tip: "Once popped = final. O(E log V)." },
  { pattern: "Bellman-Ford", when: "Negative edges, K stops", template: "V-1 rounds relax all edges", tip: "COPY dist for K-stops variant." },
  { pattern: "Topo Sort", when: "Dependencies, DAG order", template: "Kahn's: indegree BFS", tip: "count < total → cycle." },
  { pattern: "Union Find", when: "Components, connectivity, MST", template: "find + path compress + rank", tip: "unite()=false → already connected." },
  { pattern: "Sliding Window", when: "Subarray/substr constraint", template: "Expand right, shrink left", tip: "Fixed: both move. Variable: have/need." },
  { pattern: "Monotonic Stack", when: "Next greater/smaller, histogram", template: "Pop when order violated", tip: "Increasing → next smaller. Sentinel helps." },
  { pattern: "Prefix Sum + Map", when: "Subarray sum = K", template: "count += map[prefix - k]", tip: "Init {0:1}. Works for sum, XOR, mod." },
  { pattern: "Binary Search", when: "Sorted, monotonic predicate", template: "Identify sorted half first", tip: "Rotated: nums[l]<=nums[m] → left sorted." },
  { pattern: "Backtracking", when: "Generate combos/perms", template: "choose → recurse → unchoose", tip: "start idx=combos. swap=perms. sort+skip=dedup." },
  { pattern: "Two Heaps", when: "Running median, k-th element", template: "max-heap(small) + min-heap(large)", tip: "Balance sizes. C++ default = max-heap." },
];

const TIPS = [
  { title: "Pattern Recognition", tips: [
    "Shortest/min steps? → BFS (unweighted) or Dijkstra (weighted)",
    "Count ways / optimize? → DP — identify states & transitions",
    "Locally optimal → globally optimal? → Greedy (prove it!)",
    "Dependencies / ordering? → Topological Sort",
    "Choose subset with constraint? → Knapsack DP",
    "Two strings? → 2D prefix DP",
    "Pick from ends? → Interval / Game DP",
    "N ≤ 20 + subsets? → Bitmask DP",
    "Components? → Union Find / DFS",
    "Subarray + condition? → Sliding Window or Prefix + HashMap",
    "Next greater/smaller? → Monotonic Stack",
    "Sorted / search space? → Binary Search",
  ]},
  { title: "Complexity → Max N Guide", tips: [
    "O(2^N): N ≤ 20 — Bitmask DP, subsets",
    "O(N!): N ≤ 10-12 — Permutations, N-Queens",
    "O(N³): N ≤ 500 — Floyd-Warshall, interval DP",
    "O(N²): N ≤ 5000 — Most 2D DP, LIS naive",
    "O(N log N): N ≤ 10^6 — Sorting, LIS optimized",
    "O(N): N ≤ 10^7 — Linear scan, sliding window",
    "O(log N): N ≤ 10^18 — Binary search",
  ]},
  { title: "C++ STL Quick Reference", tips: [
    "priority_queue<int> = max-heap. greater<int> = min-heap",
    "lower_bound → first >= x. upper_bound → first > x",
    "accumulate(begin, end, 0) for sum. 0LL for long long",
    "iota(begin, end, 0) fills 0,1,2..n-1",
    "auto [a, b] = pair; (C++17 structured bindings)",
    "__builtin_popcount(x) counts set bits",
    "unordered_map O(1) avg. map O(log N) ordered",
    "sort with custom: sort(v.begin(), v.end(), cmp);",
  ]},
  { title: "Common Mistakes", tips: [
    "Not clarifying constraints BEFORE coding",
    "BFS: marking visited AFTER pop (causes TLE) — mark BEFORE enqueue",
    "Knapsack: forward loop in 0/1 (should be reverse)",
    "Not handling empty input, single element, overflow",
    "Dijkstra: not skipping stale heap entries",
    "Backtracking: forgetting to undo the choice",
    "Binary search: wrong mid calc → infinite loop",
    "Prefix sum: forgetting {0:1} initialization",
  ]},
  { title: "Qualcomm Compiler Dev Focus", tips: [
    "Graph algos: DAG scheduling, dependency analysis → Topo Sort",
    "Register allocation → Graph coloring (interval graph)",
    "DP on trees/DAGs for optimal code generation",
    "Union-Find for alias & points-to analysis",
    "Interval problems for live range analysis",
    "Bit manipulation — compiler backends (ARM/RISC-V)",
    "Know DFS/BFS trees: back/cross/forward edges, cycle detection",
    "String algos for lexer/parser pattern matching",
  ]},
];

// ═══ REACT UI ═══
const SECTIONS_LIST = [...new Set(PROBLEMS.map(p => p.section))];
const SC = { "DP — Knapsack":"#ff6b35","DP — String":"#ffd23f","DP — Interval / Game":"#06d6a0","DP — Bitmask":"#118ab2","DP — Sequence":"#a855f7","Graph — BFS":"#f472b6","Graph — Topo Sort":"#fb923c","Graph — Shortest Path":"#34d399","Graph — Union Find":"#60a5fa","Graph — MST":"#c084fc","Graph — Tarjan":"#f87171","Sliding Window":"#fbbf24","Monotonic Stack":"#2dd4bf","Prefix Sums":"#818cf8","Greedy":"#fb7185","Two Pointers":"#a3e635","Binary Search":"#38bdf8","Heap":"#e879f9","Trees":"#4ade80","Backtracking":"#f59e0b","Linked List":"#67e8f9","Trie":"#c4b5fd" };
const DC = { Easy:"#22c55e", Medium:"#eab308", Hard:"#ef4444" };

export default function App() {
  const [sec, setSec] = useState(null);
  const [exp, setExp] = useState(new Set());
  const [q, setQ] = useState("");
  const [view, setView] = useState("problems");
  const [sb, setSb] = useState(true);

  const filtered = useMemo(() => {
    let p = PROBLEMS;
    if (sec) p = p.filter(x => x.section === sec);
    if (q) { const s = q.toLowerCase(); p = p.filter(x => x.title.toLowerCase().includes(s)||x.pattern.toLowerCase().includes(s)||x.section.toLowerCase().includes(s)||x.intuition.toLowerCase().includes(s)||(x.keyInsight||"").toLowerCase().includes(s)); }
    return p;
  }, [sec, q]);

  const tog = id => setExp(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const F = "'IBM Plex Mono','Cascadia Code','Fira Code',monospace";
  const BG = "#060610", SF = "#0c0c18", BD = "#1a1a2e", AC = "#00ff9d", T1 = "#e4e4ef", T2 = "#7a7a8e";

  return (
    <div style={{fontFamily:F,background:BG,color:T1,minHeight:"100vh",display:"flex"}}>
      {sb && <div style={{width:250,minWidth:250,background:SF,borderRight:`1px solid ${BD}`,overflowY:"auto",position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"20px 16px 12px",borderBottom:`1px solid ${BD}`}}>
          <div style={{fontSize:11,fontWeight:800,color:AC,letterSpacing:3}}>DSA MASTER</div>
          <div style={{fontSize:9,color:T2,marginTop:2}}>QUALCOMM SR. COMPILER DEV</div>
          <div style={{fontSize:9,color:"#ff6b35",marginTop:4,fontWeight:600}}>43 PROBLEMS • 15 PATTERNS • C++</div>
        </div>
        <div style={{display:"flex",gap:2,padding:"10px 10px 6px"}}>
          {[["problems","CODE"],["cheatsheet","PATTERNS"],["tips","TIPS"]].map(([v,l])=>
            <button key={v} onClick={()=>{setView(v);setSec(null);}} style={{flex:1,padding:"6px 4px",fontSize:9,fontWeight:700,letterSpacing:1,fontFamily:F,cursor:"pointer",borderRadius:4,background:view===v?AC:"transparent",color:view===v?BG:T2,border:`1px solid ${view===v?AC:BD}`}}>{l}</button>
          )}
        </div>
        <div style={{padding:"6px 10px"}}>
          <button onClick={()=>setSec(null)} style={{width:"100%",padding:"5px 8px",textAlign:"left",fontFamily:F,fontSize:10,cursor:"pointer",borderRadius:3,border:"none",background:!sec&&view==="problems"?"#1a1a2e":"transparent",color:!sec?T1:T2}}>▸ ALL ({PROBLEMS.length})</button>
          {SECTIONS_LIST.map(s=>{const c=PROBLEMS.filter(p=>p.section===s).length;return(
            <button key={s} onClick={()=>{setSec(s);setView("problems");}} style={{display:"flex",alignItems:"center",gap:6,width:"100%",padding:"4px 8px",textAlign:"left",fontFamily:F,fontSize:9,cursor:"pointer",borderRadius:3,border:"none",background:sec===s?"#1a1a2e":"transparent",color:sec===s?T1:T2}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:SC[s],flexShrink:0}}/><span style={{flex:1}}>{s}</span><span style={{fontSize:8,color:"#444"}}>{c}</span>
            </button>);
          })}
        </div>
      </div>}

      <div style={{flex:1,overflowY:"auto",height:"100vh"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:BG+"ee",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BD}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setSb(!sb)} style={{background:"none",border:`1px solid ${BD}`,color:AC,padding:"3px 8px",borderRadius:3,cursor:"pointer",fontFamily:F,fontSize:12}}>{sb?"◀":"▶"}</button>
          {view==="problems"&&<>
            <div style={{position:"relative",flex:1,maxWidth:420}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:AC,fontSize:12}}>⌕</span>
              <input placeholder="search problems, patterns..." value={q} onChange={e=>setQ(e.target.value)} style={{width:"100%",padding:"7px 10px 7px 28px",background:SF,border:`1px solid ${BD}`,borderRadius:4,color:T1,fontFamily:F,fontSize:11,outline:"none"}}/>
            </div>
            <button onClick={()=>setExp(new Set(filtered.map(p=>p.id)))} style={{background:"none",border:`1px solid ${BD}`,color:T2,padding:"5px 10px",borderRadius:3,cursor:"pointer",fontFamily:F,fontSize:9}}>EXPAND</button>
            <button onClick={()=>setExp(new Set())} style={{background:"none",border:`1px solid ${BD}`,color:T2,padding:"5px 10px",borderRadius:3,cursor:"pointer",fontFamily:F,fontSize:9}}>COLLAPSE</button>
            <span style={{fontSize:10,color:T2}}>{filtered.length}</span>
          </>}
        </div>

        <div style={{padding:"16px 20px",maxWidth:980}}>
          {view==="problems"&&filtered.map(prob=>{const e=exp.has(prob.id),sc=SC[prob.section]||AC;return(
            <div key={prob.id} style={{background:SF,border:`1px solid ${e?sc+"55":BD}`,borderRadius:6,marginBottom:6,overflow:"hidden"}}>
              <button onClick={()=>tog(prob.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"none",border:"none",cursor:"pointer",fontFamily:F,textAlign:"left",color:T1}}>
                <span style={{fontSize:10,color:T2,minWidth:24}}>#{prob.id}</span>
                <span style={{width:5,height:5,borderRadius:"50%",background:sc}}/>
                <span style={{flex:1,fontSize:12,fontWeight:600}}>{prob.title}</span>
                <span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:DC[prob.difficulty]+"18",color:DC[prob.difficulty],fontWeight:700}}>{prob.difficulty}</span>
                {prob.leetcode>0&&<span style={{fontSize:8,padding:"2px 6px",borderRadius:8,background:"#1a1a2e",color:T2}}>LC {prob.leetcode}</span>}
                <span style={{fontSize:10,color:T2,transform:e?"rotate(90deg)":"none",transition:"transform 0.15s"}}>▶</span>
              </button>
              {e&&<div style={{padding:"0 14px 14px",borderTop:`1px solid ${BD}`}}>
                <div style={{display:"inline-block",marginTop:10,padding:"3px 8px",background:sc+"12",border:`1px solid ${sc}33`,borderRadius:3,fontSize:10,color:sc,fontWeight:700}}>◆ {prob.pattern}</div>
                <div style={{marginTop:10,padding:12,background:BG,borderRadius:4,borderLeft:`3px solid ${sc}`}}>
                  <div style={{fontSize:9,color:"#fbbf24",fontWeight:800,letterSpacing:1.5,marginBottom:5}}>INTUITION</div>
                  <div style={{fontSize:11,color:"#c8c8d8",lineHeight:1.75}}>{prob.intuition}</div>
                </div>
                {prob.keyInsight&&<div style={{marginTop:6,padding:10,background:"#0a0a1a",borderRadius:4,borderLeft:`3px solid ${AC}`}}>
                  <div style={{fontSize:9,color:AC,fontWeight:800,letterSpacing:1.5,marginBottom:4}}>KEY INSIGHT</div>
                  <div style={{fontSize:10,color:"#a8a8c0",lineHeight:1.65}}>{prob.keyInsight}</div>
                </div>}
                {prob.approach&&<div style={{marginTop:6,padding:10,background:"#0a0a1a",borderRadius:4,borderLeft:"3px solid #818cf8"}}>
                  <div style={{fontSize:9,color:"#818cf8",fontWeight:800,letterSpacing:1.5,marginBottom:4}}>APPROACH</div>
                  <div style={{fontSize:10,color:"#a8a8c0",lineHeight:1.65}}>{prob.approach}</div>
                </div>}
                <div style={{marginTop:6,fontSize:10,color:T2}}>⏱ {prob.complexity}</div>
                <div style={{marginTop:6,background:"#050508",borderRadius:4,border:`1px solid ${BD}`,overflow:"hidden"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 10px",background:"#0a0a14",borderBottom:`1px solid ${BD}`}}>
                    <span style={{fontSize:9,color:AC,fontWeight:700,letterSpacing:1}}>C++ SOLUTION</span>
                    <button onClick={ev=>{ev.stopPropagation();navigator.clipboard?.writeText(prob.code);}} style={{background:"none",border:`1px solid ${BD}`,color:T2,padding:"2px 8px",borderRadius:3,cursor:"pointer",fontFamily:F,fontSize:8}}>COPY</button>
                  </div>
                  <pre style={{margin:0,padding:12,fontSize:10.5,lineHeight:1.6,color:"#c0c0d5",overflowX:"auto",whiteSpace:"pre"}}>{prob.code}</pre>
                </div>
              </div>}
            </div>);
          })}
          {view==="problems"&&!filtered.length&&<div style={{textAlign:"center",padding:50,color:T2}}>No results.</div>}

          {view==="cheatsheet"&&<div>
            <h2 style={{fontSize:15,color:AC,marginBottom:16,borderBottom:`2px solid ${AC}`,paddingBottom:8,letterSpacing:2}}>PATTERN CHEAT SHEET</h2>
            {CHEATSHEET.map((p,i)=><div key={i} style={{background:SF,border:`1px solid ${BD}`,borderRadius:6,padding:14,marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700,color:"#22d3ee",marginBottom:6}}>{p.pattern}</div>
              <div style={{fontSize:10,color:T2,marginBottom:5}}><span style={{color:"#fbbf24",fontWeight:700}}>WHEN:</span> {p.when}</div>
              <div style={{fontSize:10,fontFamily:F,background:BG,padding:"5px 8px",borderRadius:3,color:AC,marginBottom:5}}>{p.template}</div>
              <div style={{fontSize:9,color:"#818cf8"}}>💡 {p.tip}</div>
            </div>)}
            <div style={{background:"#0a0a20",border:"1px solid #4338ca",borderRadius:6,padding:16,marginTop:16}}>
              <h3 style={{color:"#a78bfa",fontSize:13,marginBottom:10}}>DECISION TREE</h3>
              <pre style={{fontSize:10,color:"#c4b5fd",lineHeight:1.7,whiteSpace:"pre-wrap",margin:0}}>{`Shortest/min steps?
  ├─ Unweighted → BFS
  └─ Weighted → Dijkstra / Bellman-Ford
Count ways / optimize? → DP (states + transitions)
Greedy possible? → Prove local→global, then Greedy
Dependencies? → Topological Sort
Subset + constraint? → Knapsack (rev=0/1, fwd=unbounded)
Two strings → 2D prefix DP
Pick from ends → Interval / Game DP
N ≤ 20 + subsets → Bitmask DP
Components → Union Find / DFS
Subarray condition → Sliding Window / Prefix+HashMap
Next greater/smaller → Monotonic Stack
Sorted → Binary Search`}</pre>
            </div>
          </div>}

          {view==="tips"&&<div>
            <h2 style={{fontSize:15,color:AC,marginBottom:16,borderBottom:`2px solid ${AC}`,paddingBottom:8,letterSpacing:2}}>INTERVIEW TIPS & INSIGHTS</h2>
            {TIPS.map((s,i)=><div key={i} style={{background:SF,border:`1px solid ${BD}`,borderRadius:6,padding:16,marginBottom:10}}>
              <h3 style={{fontSize:13,color:"#22d3ee",marginBottom:10,fontWeight:700}}>{s.title}</h3>
              {s.tips.map((t,j)=><div key={j} style={{display:"flex",gap:8,marginBottom:6,fontSize:10.5,color:"#b8b8cc",lineHeight:1.6}}>
                <span style={{color:AC,fontWeight:700,flexShrink:0}}>▹</span><span>{t}</span>
              </div>)}
            </div>)}
          </div>}
        </div>
      </div>
    </div>
  );
}