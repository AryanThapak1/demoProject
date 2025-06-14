class RateLimiter {
  constructor(limit) {
    this.limit = limit;             // Max concurrent tasks
    this.activeCount = 0;           // Currently running tasks
    this.queue = [];                // Queue of pending tasks
  }

  async run(fn, ...args) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.activeCount++;
          const result = await fn(...args);
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.next(); // Trigger next task in the queue
        }
      };

      if (this.activeCount < this.limit) {
        task(); // Run immediately
      } else {
        this.queue.push(task); // Queue the task
      }
    });
  }

  next() {
    if (this.queue.length > 0 && this.activeCount < this.limit) {
      const nextTask = this.queue.shift();
      nextTask(); // Start next queued task
    }
  }
}

const limiter = new RateLimiter(3); // Allow max 2 concurrent tasks

const fakeApiCall = (id, delay) =>
  new Promise((res) => {
    console.log(`Starting ${id}`);
    setTimeout(() => {
      console.log(`Finished ${id}`);
      res(`Result of ${id}`);
    }, delay);
  });

(async () => {
  const tasks = [
    () => limiter.run(fakeApiCall, "A", 1000),
    () => limiter.run(fakeApiCall, "B", 500),
    () => limiter.run(fakeApiCall, "C", 200),
    () => limiter.run(fakeApiCall, "D", 300),
  ];

  const results = await Promise.all(tasks.map((t) => t()));
  console.log("All done:", results);
})();

