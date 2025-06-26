import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  timeToFirstToken: number | null;
  tokensPerSecond: number | null;
  memoryUsage: number | null;
  energyUsage: number | null;
  timestamp: number;
}

/**
 * Performance logger class for singleton pattern
 */
class PerformanceLogger {
  private metrics: PerformanceMetrics[] = [];
  private startTimes: Map<string, number> = new Map();
  
  /**
   * Log Time to First Token (TFT) - critical for perceived responsiveness
   */
  logTFT(ms: number): void {
    const timestamp = Date.now();
    console.log(`🚀 [Performance] Time to First Token: ${ms}ms`);
    
    this.metrics.push({
      timeToFirstToken: ms,
      tokensPerSecond: null,
      memoryUsage: null,
      energyUsage: null,
      timestamp
    });

    // Warn if TFT is too slow
    if (ms > 2000) {
      console.warn(`⚠️  [Performance] Slow TFT detected: ${ms}ms (target: <2000ms)`);
    } else if (ms < 500) {
      console.log(`✅ [Performance] Excellent TFT: ${ms}ms`);
    }
  }

  /**
   * Log Tokens Per Second (TPS) - streaming performance
   */
  logTPS(tokens: number, durationMs: number): void {
    if (durationMs === 0) {
      console.warn('⚠️  [Performance] Cannot calculate TPS with 0ms duration');
      return;
    }

    const tps = (tokens / durationMs) * 1000; // Convert to tokens per second
    const timestamp = Date.now();
    
    console.log(`📊 [Performance] Tokens Per Second: ${tps.toFixed(2)} TPS (${tokens} tokens in ${durationMs}ms)`);
    
    this.metrics.push({
      timeToFirstToken: null,
      tokensPerSecond: tps,
      memoryUsage: null,
      energyUsage: null,
      timestamp
    });

    // Performance thresholds
    if (tps < 5) {
      console.warn(`⚠️  [Performance] Low TPS detected: ${tps.toFixed(2)} TPS (target: >10 TPS)`);
    } else if (tps > 20) {
      console.log(`🚀 [Performance] Excellent TPS: ${tps.toFixed(2)} TPS`);
    }
  }

  /**
   * Log memory usage - uses available React Native APIs
   */
  logMemory(): void {
    const timestamp = Date.now();
    let memoryUsage: number | null = null;

    try {
      // Try different memory reporting methods based on platform
      try {
        if (Platform.OS === 'ios' && typeof global !== 'undefined' && (global as any).performance && (global as any).performance.memory) {
          // iOS with JSC might have performance.memory
          const memory = (global as any).performance.memory as any;
          memoryUsage = memory.usedJSHeapSize || memory.totalJSHeapSize || null;
        } else if (Platform.OS === 'android' && typeof global !== 'undefined' && (global as any).gc) {
          // Android might have gc stats
          try {
            const memInfo = (global as any).gc();
            memoryUsage = memInfo?.heapUsed || null;
          } catch (error) {
            // gc() might not be available
          }
        }

        // Fallback: use process.memoryUsage if available (development)
        if (!memoryUsage && typeof process !== 'undefined' && process.memoryUsage) {
          try {
            const usage = process.memoryUsage();
            memoryUsage = usage.heapUsed;
          } catch (error) {
            // process.memoryUsage might not be available in production
          }
        }
      } catch (error) {
        // Handle any global access errors
        console.warn('Failed to access global memory APIs:', error);
      }

      // Manual memory estimation based on metrics array size
      if (!memoryUsage) {
        const estimatedMemory = this.metrics.length * 100; // Rough estimate
        memoryUsage = estimatedMemory;
      }

      console.log(`💾 [Performance] Memory Usage: ${memoryUsage ? (memoryUsage / 1024 / 1024).toFixed(2) + 'MB' : 'Unknown'}`);
      
      this.metrics.push({
        timeToFirstToken: null,
        tokensPerSecond: null,
        memoryUsage,
        energyUsage: null,
        timestamp
      });

      // Memory warnings
      if (memoryUsage && memoryUsage > 100 * 1024 * 1024) { // > 100MB
        console.warn(`⚠️  [Performance] High memory usage detected: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }

    } catch (error) {
      console.warn('⚠️  [Performance] Failed to get memory usage:', error);
      
      this.metrics.push({
        timeToFirstToken: null,
        tokensPerSecond: null,
        memoryUsage: null,
        energyUsage: null,
        timestamp
      });
    }
  }

  /**
   * Log energy usage - estimates based on device activity
   */
  logEnergy(): void {
    const timestamp = Date.now();
    
    // Estimate energy usage based on current activity
    // This is a simplified implementation until native battery APIs are available
    let estimatedEnergyUsage = 1.0; // Base usage
    
    // Factor in recent activity
    const recentMetrics = this.metrics.slice(-10);
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + (m.timeToFirstToken || 0), 0) / recentMetrics.length;
    
    if (avgResponseTime > 5000) {
      estimatedEnergyUsage *= 1.5; // Higher energy for longer operations
    }
    
    if (recentMetrics.length > 5) {
      estimatedEnergyUsage *= 1.2; // Higher energy for frequent operations
    }
    
    console.log(`🔋 [Performance] Estimated energy usage: ${estimatedEnergyUsage.toFixed(2)}mW`);
    
    this.metrics.push({
      timeToFirstToken: null,
      tokensPerSecond: null,
      memoryUsage: null,
      energyUsage: estimatedEnergyUsage,
      timestamp
    });
  }

  /**
   * Start timing a specific operation
   */
  startTiming(operation: string): void {
    this.startTimes.set(operation, Date.now());
    console.log(`⏱️  [Performance] Started timing: ${operation}`);
  }

  /**
   * End timing and log the duration
   */
  endTiming(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      // Silently return 0 instead of warning for cleaner logs
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operation);
    
    console.log(`⏱️  [Performance] ${operation} completed in ${duration}ms`);
    return duration;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    avgTFT: number | null;
    avgTPS: number | null;
    peakMemory: number | null;
    totalMetrics: number;
  } {
    const tftMetrics = this.metrics.filter(m => m.timeToFirstToken !== null);
    const tpsMetrics = this.metrics.filter(m => m.tokensPerSecond !== null);
    const memoryMetrics = this.metrics.filter(m => m.memoryUsage !== null);

    const avgTFT = tftMetrics.length > 0 
      ? tftMetrics.reduce((sum, m) => sum + m.timeToFirstToken!, 0) / tftMetrics.length 
      : null;

    const avgTPS = tpsMetrics.length > 0
      ? tpsMetrics.reduce((sum, m) => sum + m.tokensPerSecond!, 0) / tpsMetrics.length
      : null;

    const peakMemory = memoryMetrics.length > 0
      ? Math.max(...memoryMetrics.map(m => m.memoryUsage!))
      : null;

    return {
      avgTFT,
      avgTPS,
      peakMemory,
      totalMetrics: this.metrics.length
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
    console.log('🧹 [Performance] Metrics cleared');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance
const performanceLogger = new PerformanceLogger();

/**
 * React hook for performance logging
 * Provides a convenient interface for logging performance metrics
 */
export const usePerformanceLogger = () => {
  const sessionStartTime = useRef<number>(Date.now());

  // Memoize the logger functions to prevent unnecessary re-renders
  const logTFT = useCallback((ms: number) => {
    performanceLogger.logTFT(ms);
  }, []);

  const logTPS = useCallback((tokens: number, durationMs: number) => {
    performanceLogger.logTPS(tokens, durationMs);
  }, []);

  const logMemory = useCallback(() => {
    performanceLogger.logMemory();
  }, []);

  const logEnergy = useCallback(() => {
    performanceLogger.logEnergy();
  }, []);

  const startTiming = useCallback((operation: string) => {
    performanceLogger.startTiming(operation);
  }, []);

  const endTiming = useCallback((operation: string) => {
    return performanceLogger.endTiming(operation);
  }, []);

  const getSummary = useCallback(() => {
    return performanceLogger.getSummary();
  }, []);

  const clearMetrics = useCallback(() => {
    performanceLogger.clearMetrics();
  }, []);

  const getSessionDuration = useCallback(() => {
    return Date.now() - sessionStartTime.current;
  }, []);

  const logSessionSummary = useCallback(() => {
    const summary = getSummary();
    const sessionDuration = getSessionDuration();
    
    console.log('\n📊 [Performance] Session Summary:');
    console.log(`⏱️  Session Duration: ${(sessionDuration / 1000).toFixed(1)}s`);
    console.log(`🚀 Average TFT: ${summary.avgTFT ? summary.avgTFT.toFixed(0) + 'ms' : 'N/A'}`);
    console.log(`📈 Average TPS: ${summary.avgTPS ? summary.avgTPS.toFixed(2) + ' TPS' : 'N/A'}`);
    console.log(`💾 Peak Memory: ${summary.peakMemory ? (summary.peakMemory / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
    console.log(`📊 Total Metrics: ${summary.totalMetrics}`);
    console.log('');
  }, [getSummary, getSessionDuration]);

  return {
    logTFT,
    logTPS,
    logMemory,
    logEnergy,
    startTiming,
    endTiming,
    getSummary,
    clearMetrics,
    getSessionDuration,
    logSessionSummary,
    exportMetrics: useCallback(() => performanceLogger.exportMetrics(), [])
  };
};

// Export singleton for direct access if needed
export { performanceLogger };

export default usePerformanceLogger;