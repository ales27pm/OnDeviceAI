import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export class NetworkUtils {
  private static instance: NetworkUtils;
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown'
  };
  private listeners: ((state: NetworkState) => void)[] = [];

  static getInstance(): NetworkUtils {
    if (!NetworkUtils.instance) {
      NetworkUtils.instance = new NetworkUtils();
    }
    return NetworkUtils.instance;
  }

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.updateNetworkState(state);

    // Subscribe to network state changes
    NetInfo.addEventListener(this.updateNetworkState.bind(this));
  }

  private updateNetworkState(state: any) {
    const newState: NetworkState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type ?? 'unknown'
    };

    const hasChanged = JSON.stringify(newState) !== JSON.stringify(this.networkState);
    this.networkState = newState;

    if (hasChanged) {
      console.log('🌐 Network state changed:', newState);
      this.notifyListeners(newState);
    }
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('❌ Network listener error:', error);
      }
    });
  }

  public getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  public isOnline(): boolean {
    return this.networkState.isConnected && this.networkState.isInternetReachable;
  }

  public isOffline(): boolean {
    return !this.isOnline();
  }

  public addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public removeAllListeners() {
    this.listeners = [];
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryWhen?: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryWhen: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.status >= 500 && error.status < 600) ||
      !NetworkUtils.getInstance().isOnline()
    );
  }
};

// Retry utility function
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ Operation succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.log(`❌ Operation failed on attempt ${attempt}:`, error);
      
      // Don't retry if we've reached max attempts
      if (attempt === finalConfig.maxAttempts) {
        break;
      }
      
      // Don't retry if the error is not retryable
      if (finalConfig.retryWhen && !finalConfig.retryWhen(error)) {
        console.log('🚫 Error is not retryable, stopping');
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );
      
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Enhanced fetch with retry and offline handling
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const networkUtils = NetworkUtils.getInstance();
  
  // Check if we're offline
  if (networkUtils.isOffline()) {
    throw new Error('No internet connection available');
  }
  
  return withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        (timeoutError as any).code = 'TIMEOUT';
        throw timeoutError;
      }
      
      if (!networkUtils.isOnline()) {
        const networkError = new Error('Network connection lost');
        (networkError as any).code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      throw error;
    }
  }, retryConfig);
}

// Queue for offline requests
export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    retryConfig?: Partial<RetryConfig>;
    timestamp: number;
  }> = [];
  private isProcessing = false;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  constructor() {
    // Listen for network state changes
    NetworkUtils.getInstance().addListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.processQueue();
      }
    });
  }

  public add(
    id: string,
    operation: () => Promise<any>,
    retryConfig?: Partial<RetryConfig>
  ) {
    // Remove existing operation with same ID
    this.queue = this.queue.filter(item => item.id !== id);
    
    // Add new operation
    this.queue.push({
      id,
      operation,
      retryConfig,
      timestamp: Date.now()
    });
    
    console.log(`📝 Added operation to offline queue: ${id}`);
    
    // Try to process immediately if online
    if (NetworkUtils.getInstance().isOnline()) {
      this.processQueue();
    }
  }

  public remove(id: string) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== id);
    
    if (this.queue.length < initialLength) {
      console.log(`🗑️ Removed operation from offline queue: ${id}`);
    }
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public clearQueue() {
    this.queue = [];
    console.log('🧹 Cleared offline queue');
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    if (NetworkUtils.getInstance().isOffline()) {
      console.log('📡 Still offline, cannot process queue');
      return;
    }
    
    this.isProcessing = true;
    console.log(`🔄 Processing offline queue (${this.queue.length} items)`);
    
    const operations = [...this.queue];
    
    for (const item of operations) {
      try {
        await withRetry(item.operation, item.retryConfig);
        this.remove(item.id);
        console.log(`✅ Successfully processed queued operation: ${item.id}`);
      } catch (error) {
        console.error(`❌ Failed to process queued operation: ${item.id}`, error);
        
        // Remove old operations (older than 1 hour)
        if (Date.now() - item.timestamp > 60 * 60 * 1000) {
          this.remove(item.id);
          console.log(`🗑️ Removed expired operation: ${item.id}`);
        }
      }
    }
    
    this.isProcessing = false;
    console.log(`✅ Finished processing offline queue`);
  }
}

export default NetworkUtils;