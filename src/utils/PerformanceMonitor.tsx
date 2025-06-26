import React from 'react';

interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  type: 'performance';
}

interface MemoryMetric {
  timestamp: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  type: 'memory';
}

interface ErrorMetric {
  timestamp: number;
  error: string;
  stack?: string;
  component?: string;
  type: 'error';
}

interface UserMetric {
  timestamp: number;
  action: string;
  screen?: string;
  metadata?: Record<string, any>;
  type: 'user_action';
}

type Metric = PerformanceMetric | MemoryMetric | ErrorMetric | UserMetric;

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private logs: Metric[] = [];
  private memoryInterval?: NodeJS.Timeout;
  private maxLogs: number = 1000;
  private enableConsoleLogging: boolean = __DEV__;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.startMemoryMonitoring();
    this.setupErrorTracking();
  }

  // Performance Timing
  startTiming(name: string, metadata?: Record<string, any>): string {
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metric: PerformanceMetric = {
      id,
      name,
      startTime: performance.now(),
      metadata,
      type: 'performance'
    };
    
    this.metrics.set(id, metric);
    
    if (this.enableConsoleLogging) {
      console.log(`⏱️ [Performance] Started timing: ${name}`);
    }
    
    return id;
  }

  endTiming(id: string): number | null {
    const metric = this.metrics.get(id);
    if (!metric) {
      console.warn(`⚠️ [Performance] No timing found for id: ${id}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    const completedMetric = {
      ...metric,
      endTime,
      duration
    };

    this.metrics.delete(id);
    this.addLog(completedMetric);

    if (this.enableConsoleLogging) {
      console.log(`✅ [Performance] ${metric.name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Convenience method for timing by name
  endTimingByName(name: string): number | null {
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.name === name) {
        return this.endTiming(id);
      }
    }
    console.warn(`⚠️ [Performance] No active timing found for name: ${name}`);
    return null;
  }

  // Memory Monitoring
  private startMemoryMonitoring() {
    // Check memory every 30 seconds
    this.memoryInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, 30000);
  }

  private recordMemoryUsage() {
    try {
      // @ts-ignore - performance.memory might not be available in all environments
      const memory = performance.memory;
      
      if (memory) {
        const memoryMetric: MemoryMetric = {
          timestamp: Date.now(),
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          totalJSHeapSize: memory.totalJSHeapSize,
          usedJSHeapSize: memory.usedJSHeapSize,
          type: 'memory'
        };
        
        this.addLog(memoryMetric);
        
        if (this.enableConsoleLogging) {
          const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
          const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
          console.log(`📊 [Memory] Used: ${usedMB}MB / Total: ${totalMB}MB`);
        }
      }
    } catch (error) {
      // Memory API not available - that's fine
    }
  }

  // Error Tracking
  private setupErrorTracking() {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      const errorMessage = args.map(arg => 
        typeof arg === 'string' ? arg : JSON.stringify(arg)
      ).join(' ');
      
      this.trackError(errorMessage);
    };
  }

  trackError(error: string | Error, component?: string, metadata?: Record<string, any>) {
    const errorMetric: ErrorMetric = {
      timestamp: Date.now(),
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      component,
      type: 'error'
    };

    this.addLog(errorMetric);

    if (this.enableConsoleLogging) {
      console.log(`❌ [Error] ${errorMetric.error} ${component ? `in ${component}` : ''}`);
    }
  }

  // User Action Tracking
  trackUserAction(action: string, screen?: string, metadata?: Record<string, any>) {
    const userMetric: UserMetric = {
      timestamp: Date.now(),
      action,
      screen,
      metadata,
      type: 'user_action'
    };

    this.addLog(userMetric);

    if (this.enableConsoleLogging) {
      console.log(`👤 [User] ${action} ${screen ? `on ${screen}` : ''}`);
    }
  }

  // Log Management
  private addLog(metric: Metric) {
    this.logs.push(metric);
    
    // Keep only the last N logs to prevent memory leaks
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  // Analytics & Reporting
  getPerformanceReport(timeframeMs: number = 300000): {
    averageTimings: Record<string, number>;
    memoryUsage: MemoryMetric[];
    errors: ErrorMetric[];
    userActions: UserMetric[];
    totalMetrics: number;
  } {
    const cutoff = Date.now() - timeframeMs;
    const recentLogs = this.logs.filter(log => 
      'timestamp' in log ? log.timestamp > cutoff : true
    );

    // Calculate average timings
    const timingLogs = recentLogs.filter(log => 
      'duration' in log && log.duration !== undefined
    ) as PerformanceMetric[];
    
    const timingGroups = timingLogs.reduce((acc, log) => {
      if (!acc[log.name]) acc[log.name] = [];
      acc[log.name].push(log.duration!);
      return acc;
    }, {} as Record<string, number[]>);

    const averageTimings = Object.entries(timingGroups).reduce((acc, [name, durations]) => {
      acc[name] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageTimings,
      memoryUsage: recentLogs.filter(log => log.type === 'memory') as MemoryMetric[],
      errors: recentLogs.filter(log => log.type === 'error') as ErrorMetric[],
      userActions: recentLogs.filter(log => log.type === 'user_action') as UserMetric[],
      totalMetrics: recentLogs.length
    };
  }

  // Get slow operations (> threshold ms)
  getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    return this.logs
      .filter(log => 
        'duration' in log && 
        log.duration !== undefined && 
        log.duration > thresholdMs
      ) as PerformanceMetric[];
  }

  // Get error frequency
  getErrorFrequency(timeframeMs: number = 300000): Record<string, number> {
    const cutoff = Date.now() - timeframeMs;
    const errorLogs = this.logs.filter(log => 
      log.type === 'error' && 
      'timestamp' in log && 
      log.timestamp > cutoff
    ) as ErrorMetric[];

    return errorLogs.reduce((acc, log) => {
      acc[log.error] = (acc[log.error] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Configuration
  setMaxLogs(max: number) {
    this.maxLogs = max;
  }

  setConsoleLogging(enabled: boolean) {
    this.enableConsoleLogging = enabled;
  }

  // Cleanup
  cleanup() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    this.metrics.clear();
    this.logs = [];
  }

  // Export data
  exportLogs(): string {
    return JSON.stringify({
      metrics: Array.from(this.metrics.values()),
      logs: this.logs,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    console.log('🧹 [Performance] Logs cleared');
  }
}

// Hook for React components
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = () => {
  const monitor = useRef(PerformanceMonitor.getInstance());

  return {
    startTiming: monitor.current.startTiming.bind(monitor.current),
    endTiming: monitor.current.endTiming.bind(monitor.current),
    endTimingByName: monitor.current.endTimingByName.bind(monitor.current),
    trackError: monitor.current.trackError.bind(monitor.current),
    trackUserAction: monitor.current.trackUserAction.bind(monitor.current),
    getPerformanceReport: monitor.current.getPerformanceReport.bind(monitor.current),
    getSlowOperations: monitor.current.getSlowOperations.bind(monitor.current),
    getErrorFrequency: monitor.current.getErrorFrequency.bind(monitor.current),
  };
};

// Component wrapper for automatic screen tracking
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  screenName: string
): React.ComponentType<P> => {
  return (props: P) => {
    const monitor = PerformanceMonitor.getInstance();

    useEffect(() => {
      const timingId = monitor.startTiming(`screen_render_${screenName}`);
      monitor.trackUserAction('screen_view', screenName);

      return () => {
        monitor.endTiming(timingId);
      };
    }, [monitor]);

    return <Component {...props} />;
  };
};

export default PerformanceMonitor;