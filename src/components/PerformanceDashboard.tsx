import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePerformanceMonitor } from '../utils/PerformanceMonitor';
import { AnimatedView } from './AnimatedComponents';
import { LoadingSpinner } from './LoadingStates';

const { width: screenWidth } = Dimensions.get('window');

interface PerformanceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend
}) => (
  <AnimatedView style={[styles.metricCard, { borderLeftColor: color }]}>
    <View style={styles.metricHeader}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && (
          <Text style={styles.metricSubtitle}>{subtitle}</Text>
        )}
      </View>
      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons 
            name={
              trend === 'up' ? 'trending-up' : 
              trend === 'down' ? 'trending-down' : 
              'remove'
            } 
            size={16} 
            color={
              trend === 'up' ? '#EF4444' : 
              trend === 'down' ? '#10B981' : 
              '#6B7280'
            } 
          />
        </View>
      )}
    </View>
  </AnimatedView>
);

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState(300000); // 5 minutes
  
  const { 
    getPerformanceReport, 
    getSlowOperations, 
    getErrorFrequency,
    trackUserAction 
  } = usePerformanceMonitor();

  useEffect(() => {
    if (visible) {
      trackUserAction('open_performance_dashboard');
      loadPerformanceData();
    }
  }, [visible, timeframe]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const report = getPerformanceReport(timeframe);
      const slowOps = getSlowOperations(500);
      const errorFreq = getErrorFrequency(timeframe);
      
      setReportData({
        ...report,
        slowOperations: slowOps,
        errorFrequency: errorFreq
      });
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  };

  const getTimeframeLabel = (ms: number): string => {
    const minutes = ms / 60000;
    if (minutes < 60) return `${minutes}min`;
    return `${(minutes / 60).toFixed(1)}h`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Performance Dashboard</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          <Text style={styles.timeframeLabel}>Timeframe:</Text>
          <View style={styles.timeframeButtons}>
            {[
              { label: '5min', value: 300000 },
              { label: '15min', value: 900000 },
              { label: '1hour', value: 3600000 },
              { label: '24h', value: 86400000 }
            ].map(({ label, value }) => (
              <Pressable
                key={value}
                style={[
                  styles.timeframeButton,
                  timeframe === value && styles.timeframeButtonActive
                ]}
                onPress={() => setTimeframe(value)}
              >
                <Text style={[
                  styles.timeframeButtonText,
                  timeframe === value && styles.timeframeButtonTextActive
                ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" text="Loading performance data..." />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {reportData && (
              <>
                {/* Overview Metrics */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Overview</Text>
                  
                  <MetricCard
                    title="Total Metrics"
                    value={reportData.totalMetrics}
                    subtitle={`In last ${getTimeframeLabel(timeframe)}`}
                    icon="analytics"
                    color="#3B82F6"
                  />
                  
                  <MetricCard
                    title="Memory Usage"
                    value={reportData.memoryUsage.length > 0 
                      ? formatMemory(reportData.memoryUsage[reportData.memoryUsage.length - 1].usedJSHeapSize || 0)
                      : 'N/A'
                    }
                    subtitle="Current JS heap size"
                    icon="hardware-chip"
                    color="#10B981"
                  />
                  
                  <MetricCard
                    title="Error Count"
                    value={reportData.errors.length}
                    subtitle={`${Object.keys(reportData.errorFrequency).length} unique errors`}
                    icon="warning"
                    color="#EF4444"
                    trend={reportData.errors.length > 5 ? 'up' : 'stable'}
                  />
                  
                  <MetricCard
                    title="User Actions"
                    value={reportData.userActions.length}
                    subtitle="Tracked interactions"
                    icon="finger-print"
                    color="#8B5CF6"
                  />
                </View>

                {/* Performance Timings */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Average Timings</Text>
                  
                  {Object.keys(reportData.averageTimings).length > 0 ? (
                    Object.entries(reportData.averageTimings).map(([name, duration]) => (
                      <View key={name} style={styles.timingItem}>
                        <Text style={styles.timingName}>{name}</Text>
                        <Text style={[
                          styles.timingDuration,
                          (duration as number) > 1000 && styles.slowTiming
                        ]}>
                          {formatDuration(duration as number)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="timer-outline" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>No timing data available</Text>
                    </View>
                  )}
                </View>

                {/* Slow Operations */}
                {reportData.slowOperations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Slow Operations (&gt;500ms)</Text>
                    
                    {reportData.slowOperations.slice(0, 5).map((op: any, index: number) => (
                      <View key={index} style={styles.slowOpItem}>
                        <View style={styles.slowOpHeader}>
                          <Text style={styles.slowOpName}>{op.name}</Text>
                          <Text style={styles.slowOpDuration}>
                            {formatDuration(op.duration)}
                          </Text>
                        </View>
                        {op.metadata && (
                          <Text style={styles.slowOpMetadata}>
                            {JSON.stringify(op.metadata)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent Errors */}
                {reportData.errors.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Errors</Text>
                    
                    {reportData.errors.slice(-5).reverse().map((error: any, index: number) => (
                      <View key={index} style={styles.errorItem}>
                        <View style={styles.errorHeader}>
                          <Ionicons name="warning" size={16} color="#EF4444" />
                          <Text style={styles.errorMessage}>{error.error}</Text>
                        </View>
                        {error.component && (
                          <Text style={styles.errorComponent}>in {error.component}</Text>
                        )}
                        <Text style={styles.errorTime}>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Recent User Actions */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Actions</Text>
                  
                  {reportData.userActions.slice(-10).reverse().map((action: any, index: number) => (
                    <View key={index} style={styles.actionItem}>
                      <View style={styles.actionHeader}>
                        <Ionicons name="finger-print" size={16} color="#8B5CF6" />
                        <Text style={styles.actionName}>{action.action}</Text>
                      </View>
                      {action.screen && (
                        <Text style={styles.actionScreen}>on {action.screen}</Text>
                      )}
                      <Text style={styles.actionTime}>
                        {new Date(action.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Footer spacing */}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  timeframeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  timeframeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  timeframeButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  timeframeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeframeButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  metricCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trendContainer: {
    padding: 4,
  },
  timingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  timingName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  timingDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  slowTiming: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  slowOpItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  slowOpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slowOpName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  slowOpDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  slowOpMetadata: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  errorComponent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionName: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  actionScreen: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default PerformanceDashboard;