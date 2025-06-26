import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { NativeCalendarModule } from '../modules/NativeCalendarModule';
import { usePerformanceLogger } from '../hooks/usePerformanceLogger';

/**
 * Simple test component to verify our fixes
 */
export const TestComponent: React.FC = () => {
  const [nativeCalendarStatus, setNativeCalendarStatus] = useState<string>('checking...');
  const [performanceTest, setPerformanceTest] = useState<string>('');
  const performanceLogger = usePerformanceLogger();

  useEffect(() => {
    testNativeCalendar();
    testPerformanceLogger();
  }, []);

  const testNativeCalendar = async () => {
    try {
      const calendarModule = NativeCalendarModule.getInstance();
      
      if (calendarModule.isAvailable()) {
        await calendarModule.initialize();
        setNativeCalendarStatus('✅ Available and initialized');
      } else {
        setNativeCalendarStatus('⚠️  Not available (expected in Expo)');
      }
    } catch (error) {
      setNativeCalendarStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testPerformanceLogger = () => {
    try {
      performanceLogger.logTFT(500);
      performanceLogger.logTPS(20, 1000);
      performanceLogger.logMemory();
      
      const summary = performanceLogger.getSummary();
      setPerformanceTest(`✅ Performance logger works - ${summary.totalMetrics} metrics recorded`);
    } catch (error) {
      setPerformanceTest(`❌ Performance logger error: ${error}`);
    }
  };

  const runFullTest = () => {
    Alert.alert(
      'Test Results',
      `Native Calendar: ${nativeCalendarStatus}\nPerformance Logger: ${performanceTest}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        OnDeviceAI System Test
      </Text>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontWeight: '600' }}>Native Calendar Status:</Text>
        <Text>{nativeCalendarStatus}</Text>
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: '600' }}>Performance Logger Status:</Text>
        <Text>{performanceTest}</Text>
      </View>
      
      <Pressable
        style={{
          backgroundColor: '#3B82F6',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center'
        }}
        onPress={runFullTest}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Show Test Results
        </Text>
      </Pressable>
    </View>
  );
};

export default TestComponent;