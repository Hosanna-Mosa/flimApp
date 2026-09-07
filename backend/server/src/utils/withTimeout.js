/**
 * Bounds a promise that a user is waiting on.
 *
 * The app aborts its own requests after 15s (app/utils/api.ts), so any upstream
 * call slower than that reached the user as a client-side timeout with no
 * response and no status to explain it. Anything on a request path that talks
 * to a third party should be wrapped here, well inside that budget.
 */
class TimeoutError extends Error {
  constructor(label, ms) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.label = label;
    this.ms = ms;
  }
}

const withTimeout = (promise, ms, label = 'Operation') => {
  let timer;
  // When the timeout wins the race the original promise is still in flight and
  // may reject later with nothing attached to it — an unhandled rejection,
  // which recent Node versions treat as fatal. This no-op marks it handled.
  promise.catch(() => {});
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

module.exports = { withTimeout, TimeoutError };
