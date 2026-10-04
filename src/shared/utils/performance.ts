import { logger } from './logger';

interface VitalMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

const vitals: VitalMetrics = {};

/**
 * Monitor Core Web Vitals (LCP, FID, CLS)
 * Reports metrics to console in development and to monitoring service in production
 */
export function initPerformanceMonitoring() {
  if (!('web-vital' in window) && typeof window !== 'undefined') {
    // Monitor LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
          logger.info('LCP', { lcp: vitals.lcp });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!('hadRecentInput' in entry) || !(entry as any).hadRecentInput) {
              vitals.cls = ((vitals.cls || 0) + (entry as any).value);
              logger.info('CLS', { cls: vitals.cls });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor FID (First Input Delay)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = (entry as any).processingDuration;
            logger.info('FID', { fid: vitals.fid });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        logger.error('Failed to initialize performance monitoring', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

/**
 * Get current vital metrics
 */
export function getVitals(): VitalMetrics {
  return { ...vitals };
}

/**
 * Measure and log execution time of async functions
 * Usage:
 *   const result = await measureAsync('loadQuestions', () => fetchQuestions());
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.info(`${label} completed in ${duration.toFixed(2)}ms`, {
      duration: Math.round(duration),
    });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${label} failed after ${duration.toFixed(2)}ms`, {
      duration: Math.round(duration),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Measure and log execution time of sync functions
 * Usage:
 *   const result = measure('filterQuestions', () => filterQuestions(questions));
 */
export function measure<T>(label: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    logger.debug(`${label} completed in ${duration.toFixed(2)}ms`, {
      duration: Math.round(duration),
    });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${label} failed after ${duration.toFixed(2)}ms`, {
      duration: Math.round(duration),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Report performance metrics to external service
 * Implement based on your monitoring provider (Sentry, DataDog, etc.)
 */
export function reportMetrics() {
  const metrics = getVitals();
  logger.info('Performance metrics', metrics);

  // TODO: Send to monitoring service in production
  // Example: sendToSentry({ ...metrics });
}
