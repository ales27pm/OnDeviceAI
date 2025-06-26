import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📍 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <SafeAreaView className="flex-1 bg-red-50">
          <View className="flex-1 justify-center items-center px-6">
            <View className="bg-white rounded-2xl p-8 shadow-lg max-w-sm w-full">
              <View className="items-center mb-6">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center">
                  Something went wrong
                </Text>
                <Text className="text-gray-600 text-center mt-2">
                  The app encountered an unexpected error
                </Text>
              </View>

              {__DEV__ && this.state.error && (
                <View className="bg-gray-100 rounded-lg p-3 mb-4">
                  <Text className="text-xs font-mono text-gray-800 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </Text>
                  {this.state.error.stack && (
                    <Text className="text-xs font-mono text-gray-600" numberOfLines={5}>
                      {this.state.error.stack}
                    </Text>
                  )}
                </View>
              )}

              <Pressable
                className="bg-blue-500 rounded-xl py-3 px-6 active:bg-blue-600"
                onPress={this.handleRetry}
              >
                <Text className="text-white font-semibold text-center">
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper component for easier usage
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
};

// Custom error fallback component for specific use cases
export const ErrorFallback: React.FC<{ 
  error?: Error; 
  retry: () => void;
  title?: string;
  description?: string;
}> = ({ error, retry, title = "Something went wrong", description = "Please try again" }) => {
  return (
    <View className="flex-1 justify-center items-center px-6 bg-gray-50">
      <View className="bg-white rounded-2xl p-6 shadow-sm max-w-sm w-full">
        <View className="items-center mb-4">
          <Ionicons name="warning-outline" size={48} color="#F59E0B" />
          <Text className="text-lg font-semibold text-gray-900 mt-3 text-center">
            {title}
          </Text>
          <Text className="text-gray-600 text-center mt-1">
            {description}
          </Text>
        </View>

        <Pressable
          className="bg-blue-500 rounded-lg py-3 px-4 active:bg-blue-600"
          onPress={retry}
        >
          <Text className="text-white font-medium text-center">
            Try Again
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ErrorBoundary;