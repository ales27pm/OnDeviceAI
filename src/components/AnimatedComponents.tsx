import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  runOnJS
} from 'react-native-reanimated';

// Animated View with reanimated v3
export const AnimatedView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | any;
  entering?: any;
  exiting?: any;
  animate?: boolean;
  duration?: number;
}> = ({ children, style, entering, exiting, animate = true, duration = 300 }) => {
  const opacity = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.8 : 1);

  React.useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, { duration });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [animate, opacity, scale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View 
      style={[style, animatedStyle]} 
      entering={entering}
      exiting={exiting}
    >
      {children}
    </Animated.View>
  );
};

// Animated Text with reanimated v3
export const AnimatedText: React.FC<{
  children: React.ReactNode;
  style?: TextStyle | any;
  entering?: any;
  exiting?: any;
  animate?: boolean;
  duration?: number;
}> = ({ children, style, entering, exiting, animate = true, duration = 300 }) => {
  const opacity = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 10 : 0);

  React.useEffect(() => {
    if (animate) {
      opacity.value = withTiming(1, { duration });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
    }
  }, [animate, opacity, translateY, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text 
      style={[style, animatedStyle]} 
      entering={entering}
      exiting={exiting}
    >
      {children}
    </Animated.Text>
  );
};

// Pulse animation for loading states
export const PulseView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | any;
  isActive?: boolean;
}> = ({ children, style, isActive = true }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Fade in/out animation
export const FadeView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | any;
  visible?: boolean;
  duration?: number;
  onFadeComplete?: () => void;
}> = ({ children, style, visible = true, duration = 300, onFadeComplete }) => {
  const opacity = useSharedValue(visible ? 1 : 0);

  React.useEffect(() => {
    opacity.value = withTiming(
      visible ? 1 : 0, 
      { duration },
      (finished) => {
        if (finished && onFadeComplete) {
          runOnJS(onFadeComplete)();
        }
      }
    );
  }, [visible, opacity, duration, onFadeComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Slide animation
export const SlideView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle | any;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  visible?: boolean;
  duration?: number;
}> = ({ 
  children, 
  style, 
  direction = 'up', 
  distance = 100, 
  visible = true, 
  duration = 300 
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: distance };
    }
  };

  React.useEffect(() => {
    const initial = getInitialPosition();
    
    if (visible) {
      translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    } else {
      translateX.value = withTiming(initial.x, { duration });
      translateY.value = withTiming(initial.y, { duration });
    }
  }, [visible, direction, distance, duration, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default {
  AnimatedView,
  AnimatedText,
  PulseView,
  FadeView,
  SlideView,
};