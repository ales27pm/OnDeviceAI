import { useState, useEffect } from 'react';
import { NetworkUtils, NetworkState, OfflineQueue } from '../utils/NetworkUtils';

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown'
  });
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const networkUtils = NetworkUtils.getInstance();
    const offlineQueue = OfflineQueue.getInstance();

    // Get initial state
    setNetworkState(networkUtils.getNetworkState());
    setQueueSize(offlineQueue.getQueueSize());

    // Listen for network changes
    const unsubscribe = networkUtils.addListener((state) => {
      setNetworkState(state);
    });

    // Poll queue size (since OfflineQueue doesn't have listeners yet)
    const queueInterval = setInterval(() => {
      setQueueSize(offlineQueue.getQueueSize());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(queueInterval);
    };
  }, []);

  return {
    ...networkState,
    isOnline: networkState.isConnected && networkState.isInternetReachable,
    isOffline: !(networkState.isConnected && networkState.isInternetReachable),
    queueSize,
    networkType: networkState.type,
  };
};

export default useNetworkStatus;