<!--
category: C++ Systems Engineering
tags: Concurrency, Atomics, Memory Order, Mutex, Condition Variable, Lock-Free
difficulty: Advanced
readTime: 25 min
-->

# C++ Concurrency, Atomics, and Memory Models

Memory ordering dictates how memory writes in one thread become visible to another. 

## 1. Memory Ordering Semantics

### `memory_order_relaxed`
- **Guarantees**: Only atomicity (no partial writes).
- **Synchronization**: None. No ordering of other memory operations.
- **Use Case**: Independent counters (e.g., stats tracking) where performance is critical and sequence doesn't matter.

### `memory_order_release` (Store)
- **Effect**: "Everything I wrote **before** this store must be visible to any thread that performs an `acquire` on this same variable."
- **HFT Context**: Used to "publish" data after a non-atomic segment is ready.

### `memory_order_acquire` (Load)
- **Effect**: "Everything the producer **released** must be visible to me **after** this load returns."
- **Synchronization**: Establishes a **Happens-Before** relationship with the matching Release.

### `memory_order_seq_cst` (The Default)
- **Effect**: Sequential Consistency. Enforces a total global ordering of all operations.
- **Cost**: Slowest. Adds heavy-duty memory fences on many architectures.

---

## 2. Synchronization Flow Example
In HFT systems, we often use the **Acquire/Release Pair** for lock-free communication.

```cpp
// Producer
shared_data = value;              // (1) Non-atomic write
ready.store(true, std::memory_order_release); // (2) Signal data is ready

// Consumer
while(!ready.load(std::memory_order_acquire)) {} // (3) Wait for signal
use(shared_data);                 // (4) Safe to read (1)
```

The `release` at (2) and `acquire` at (3) ensure that (1) **happens before** (4) across threads.

---

## 3. `std::lock_guard` vs. `std::unique_lock`

Both provide RAII-based mutex management, but they differ in flexibility and performance.

| Feature | `std::lock_guard` | `std::unique_lock` |
| :--- | :--- | :--- |
| **Strategy** | Strict RAII (Scoped) | Flexible RAII |
| **Overhead** | Minimal (Just the lock/unlock) | Slightly more (tracks own state) |
| **Manual Control**| Cannot unlock early | `unlock()` / `relock()` allowed |
| **CV Support** | No | **Required** for `std::condition_variable` |

---

## 4. The `std::condition_variable` Flow
Using a condition variable requires a `std::unique_lock` because its `wait()` function performs an atomic multi-step operation:

### The "Unlock-Sleep-Relock" Cycle
1.  **Unique Lock**: The thread acquires a `std::unique_lock` on a mutex.
2.  **Wait Call**: `cv.wait(lock, predicate)` is called.
3.  **Atomic Unlock & Sleep**: The mutex is automatically **unlocked**, and the thread is put to sleep. This happens at the same time to prevent a "lost wakeup" race condition.
4.  **Wake-up & Relock**: When notified (`cv.notify_one/all`), the thread wakes up and **automatically re-acquires the mutex** before `wait()` returns.
5.  **Predicate Check**: The predicate is checked again. If it's false, the cycle repeats.

---

## 5. Best Practices
- Use `std::lock_guard` by default for simple scoped locks.
- Use `std::unique_lock` only when you need the `std::condition_variable` or deferred/conditional locking.
