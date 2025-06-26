import React from 'react';
import { View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { PulseView } from './AnimatedComponents';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'small', 
  color = '#3B82F6',
  text 
}) => {
  return (
    <View className="items-center justify-center py-4">
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 mt-2 text-sm">
          {text}
        </Text>
      )}
    </View>
  );
};

interface LoadingDotsProps {
  color?: string;
  size?: number;
  text?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  color = '#3B82F6',
  size = 8,
  text = 'Loading'
}) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  React.useEffect(() => {
    const animation = () => {
      dot1.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      );
      
      setTimeout(() => {
        dot2.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        );
      }, 200);
      
      setTimeout(() => {
        dot3.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        );
      }, 400);
    };

    animation();
    const interval = setInterval(animation, 1200);

    return () => clearInterval(interval);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot1.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot2.value, [0, 1], [0.8, 1.2]) }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(dot3.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <View className="items-center justify-center py-4">
      <View className="flex-row items-center space-x-2 mb-2">
        <Animated.View 
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            },
            dot1Style
          ]} 
        />
        <Animated.View 
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              marginLeft: 4,
            },
            dot2Style
          ]} 
        />
        <Animated.View 
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              marginLeft: 4,
            },
            dot3Style
          ]} 
        />
      </View>
      {text && (
        <Text className="text-gray-600 text-sm">
          {text}
        </Text>
      )}
    </View>
  );
};

interface LoadingSkeletonProps {
  lines?: number;
  height?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  lines = 3, 
  height = 16,
  className = ''
}) => {
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-screenWidth, screenWidth]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <View 
          key={index}
          className="bg-gray-200 rounded overflow-hidden"
          style={{ 
            height,
            width: index === lines - 1 ? '80%' : '100%' 
          }}
        >
          <Animated.View
            className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            style={shimmerStyle}
          />
        </View>
      ))}
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  type?: 'spinner' | 'dots';
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible,
  text = 'Loading...',
  type = 'spinner',
  transparent = false
}) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: visible ? 'auto' : 'none' as any,
  }));

  if (!visible) return null;

  return (
    <Animated.View 
      className={`absolute inset-0 z-50 items-center justify-center ${
        transparent ? 'bg-black/20' : 'bg-white/90'
      }`}
      style={overlayStyle}
    >
      <View className={`${transparent ? 'bg-white' : 'bg-transparent'} rounded-2xl p-6 shadow-lg`}>
        {type === 'spinner' ? (
          <LoadingSpinner text={text} size="large" />
        ) : (
          <LoadingDots text={text} />
        )}
      </View>
    </Animated.View>
  );
};

interface MessageLoadingProps {
  isVisible: boolean;
  className?: string;
}

export const MessageLoading: React.FC<MessageLoadingProps> = ({ 
  isVisible,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <View className={`flex-row items-center py-3 px-4 ${className}`}>
      <View className="bg-gray-100 rounded-2xl p-3 max-w-xs">
        <LoadingDots size={6} text="" color="#9CA3AF" />
      </View>
    </View>
  );
};

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
  disabled = false,
  className = '',
  loadingText
}) => {
  return (
    <View className={`relative ${className}`}>
      {/* Original content with opacity change */}
      <View style={{ opacity: loading ? 0 : 1 }}>
        {children}
      </View>
      
      {/* Loading overlay */}
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#FFFFFF" />
            {loadingText && (
              <Text className="text-white ml-2 font-medium">
                {loadingText}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

interface NetworkStatusProps {
  isOnline: boolean;
  queueSize?: number;
  className?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  isOnline,
  queueSize = 0,
  className = ''
}) => {
  if (isOnline && queueSize === 0) return null;

  return (
    <View className={`bg-yellow-50 border-l-4 border-yellow-400 p-3 ${className}`}>
      <View className="flex-row items-center">
        <Ionicons 
          name={isOnline ? "cloud-upload" : "cloud-offline"} 
          size={20} 
          color="#F59E0B" 
        />
        <Text className="text-yellow-800 ml-2 flex-1">
          {!isOnline && "You're offline. Messages will be sent when connection is restored."}
          {isOnline && queueSize > 0 && `Sending ${queueSize} queued message${queueSize > 1 ? 's' : ''}...`}
        </Text>
      </View>
    </View>
  );
};

export default {
  LoadingSpinner,
  LoadingDots,
  LoadingSkeleton,
  LoadingOverlay,
  MessageLoading,
  ButtonLoading,
  NetworkStatus,
};