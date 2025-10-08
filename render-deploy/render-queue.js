/**
 * Simple in-process render queue with bounded concurrency
 * For production, replace with BullMQ + Redis or AWS SQS
 */
class RenderQueue {
  constructor({ concurrency = 4 } = {}) {
    // Simple bounded concurrency implementation (avoiding p-limit ESM issues)
    this.queue = [];
    this.active = 0;
    this.concurrency = concurrency;
    this.pending = new Map(); // tokenId-version -> Promise
    this.stats = {
      queued: 0,
      completed: 0,
      failed: 0,
    };
  }

  /**
   * Enqueue a render job
   * Returns a promise that resolves when the render completes
   */
  async enqueue({ tokenId, version, renderFn }) {
    const key = `${tokenId}-${version}`;

    // If already in progress, return existing promise (single-flight)
    if (this.pending.has(key)) {
      console.log(`   🔄 Render already in progress: ${key}`);
      return this.pending.get(key);
    }

    console.log(`   ➕ Enqueuing render: ${key}`);
    this.stats.queued++;

    // Create bounded promise
    const promise = new Promise((resolve, reject) => {
      const run = async () => {
        try {
          this.active++;
          console.log(`   🎨 Starting render: ${key}`);
          const result = await renderFn();
          this.stats.completed++;
          console.log(`   ✅ Render completed: ${key}`);
          resolve(result);
        } catch (error) {
          this.stats.failed++;
          console.error(`   ❌ Render failed: ${key}`, error.message);
          reject(error);
        } finally {
          this.active--;
          this.pending.delete(key);
          // Start next queued job if any
          if (this.queue.length > 0 && this.active < this.concurrency) {
            const nextJob = this.queue.shift();
            nextJob();
          }
        }
      };

      // If under concurrency limit, run immediately
      if (this.active < this.concurrency) {
        run();
      } else {
        // Otherwise queue it
        this.queue.push(run);
      }
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Check if a render is currently in progress
   */
  isInProgress({ tokenId, version }) {
    const key = `${tokenId}-${version}`;
    return this.pending.has(key);
  }

  /**
   * Get current queue stats
   */
  getStats() {
    return {
      ...this.stats,
      inProgress: this.pending.size,
    };
  }
}

// Global queue instance (shared across requests)
const renderQueue = new RenderQueue({ concurrency: 4 });

module.exports = { RenderQueue, renderQueue };
