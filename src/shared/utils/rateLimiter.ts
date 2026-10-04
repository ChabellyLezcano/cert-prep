/**
 * Simple client-side rate limiting with configurable throttle/debounce.
 * For production, implement server-side rate limiting on Supabase.
 */

type ThrottleOptions = {
  maxRequests: number;
  windowMs: number;
};

export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(options: ThrottleOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter((timestamp) => timestamp > windowStart);

    // Check if we've exceeded the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Record this request
    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const activeRequests = this.requests.filter((timestamp) => timestamp > windowStart);
    return Math.max(0, this.maxRequests - activeRequests.length);
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Create a rate-limited version of a function
 * Usage:
 *   const searchLimiter = createRateLimiter(searchApi, { maxRequests: 5, windowMs: 1000 });
 *   searchLimiter(query); // Will only execute if rate limit allows
 */
export function createRateLimiter<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  options: ThrottleOptions,
): (...args: Parameters<T>) => ReturnType<T> | void {
  const limiter = new RateLimiter(options);

  return ((...args: Parameters<T>) => {
    if (limiter.isAllowed()) {
      return fn(...args);
    }
  }) as any;
}

/**
 * Debounce helper for search inputs and similar interactions
 * Usage:
 *   const debouncedSearch = debounce(search, 300);
 *   input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Throttle helper for scroll, resize, and similar high-frequency events
 * Usage:
 *   window.addEventListener('scroll', throttle(() => updateUI(), 200));
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number,
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun >= limitMs) {
      fn(...args);
      lastRun = now;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        fn(...args);
        lastRun = Date.now();
        timeoutId = null;
      }, limitMs - (now - lastRun));
    }
  };
}
