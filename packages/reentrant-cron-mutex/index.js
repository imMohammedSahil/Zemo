/**
 * reentrant-cron-mutex
 * Wraps an async job in a re-entrant mutex lock to prevent concurrent execution overlaps.
 */

class CronMutex {
  constructor(name = "cron-job") {
    this.name = name;
    this.isRunning = false;
    this.lastRunStartTime = null;
    this.lastRunEndTime = null;
    this.runCount = 0;
    this.skippedCount = 0;
  }

  /**
   * Run an async task with mutual exclusion.
   * If an earlier run is still executing, skips the new run safely.
   * @param {Function} task - Async function to execute
   * @returns {Promise<{ executed: boolean, result?: any, skipped?: boolean }>}
   */
  async run(task) {
    if (this.isRunning) {
      this.skippedCount++;
      return { executed: false, skipped: true, reason: `Job "${this.name}" is already in progress.` };
    }

    this.isRunning = true;
    this.lastRunStartTime = new Date();
    this.runCount++;

    try {
      const result = await task();
      this.lastRunEndTime = new Date();
      return { executed: true, skipped: false, result };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Wraps a function into a ready-to-use cron callback function.
   * @param {Function} fn - Async job
   * @param {Object} [options]
   * @param {Function} [options.onSkip] - Callback when an execution is skipped
   * @returns {Function}
   */
  wrap(fn, { onSkip = null } = {}) {
    return async () => {
      const res = await this.run(fn);
      if (res.skipped && typeof onSkip === "function") {
        onSkip(res);
      }
      return res;
    };
  }
}

function createCronMutex(nameOrFn, options = {}) {
  if (typeof nameOrFn === "function") {
    const mutex = new CronMutex("anonymous-cron");
    return mutex.wrap(nameOrFn, options);
  }
  return new CronMutex(nameOrFn);
}

module.exports = { CronMutex, createCronMutex };

