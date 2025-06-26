import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, useVoiceSettings, useChatSettings, useNotificationSettings, usePrivacySettings } from '../state/settingsStore';
import { useModal } from '../contexts/ModalContext';
import { AnimatedView, SlideView } from '../components/AnimatedComponents';
import { LoadingSpinner } from '../components/LoadingStates';
import { PerformanceDashboard } from '../components/PerformanceDashboard';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, icon }) => (
  <AnimatedView style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#374151" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </AnimatedView>
);

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  type?: 'switch' | 'button' | 'info';
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
  rightElement,
  type = 'button'
}) => (
  <Pressable 
    style={styles.settingsItem}
    onPress={onPress}
    disabled={type === 'info'}
  >
    <View style={styles.settingsItemContent}>
      <Text style={styles.settingsItemTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
      )}
    </View>
    
    {type === 'switch' && (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#F3F4F6', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#9CA3AF'}
      />
    )}
    
    {type === 'button' && (
      rightElement || <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
    
    {type === 'info' && rightElement}
  </Pressable>
);

export const SettingsScreen: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const { showAlert, showConfirm, showPrompt } = useModal();
  
  // Settings hooks
  const voiceSettings = useVoiceSettings();
  const chatSettings = useChatSettings();
  const notificationSettings = useNotificationSettings();
  const privacySettings = usePrivacySettings();
  
  // Settings actions
  const {
    updateVoiceSettings,
    updateChatSettings,
    updateNotificationSettings,
    updatePrivacySettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    version,
    lastUpdated,
    hasCompletedOnboarding,
    markOnboardingComplete
  } = useSettingsStore();

  const handleExportSettings = async () => {
    setIsExporting(true);
    try {
      const settingsJson = exportSettings();
      
      // In a real app, you'd share this via the share API or save to file
      showAlert(
        'Settings Exported',
        'Your settings have been exported successfully. In a production app, this would be saved to a file or shared.',
        [{ text: 'OK' }],
        'success'
      );
      
      console.log('Exported settings:', settingsJson);
    } catch (error) {
      showAlert(
        'Export Failed',
        'Failed to export settings. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSettings = async () => {
    const settingsJson = await showPrompt(
      'Import Settings',
      'Paste your exported settings JSON here:',
      undefined,
      {
        placeholder: 'Paste settings JSON...',
        multiline: true
      }
    );

    if (settingsJson) {
      const success = importSettings(settingsJson);
      if (success) {
        showAlert(
          'Settings Imported',
          'Your settings have been imported successfully.',
          [{ text: 'OK' }],
          'success'
        );
      } else {
        showAlert(
          'Import Failed',
          'Invalid settings format. Please check your JSON and try again.',
          [{ text: 'OK' }],
          'error'
        );
      }
    }
  };

  const handleResetSettings = () => {
    showConfirm(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
      () => {
        resetToDefaults();
        showAlert(
          'Settings Reset',
          'All settings have been reset to their default values.',
          [{ text: 'OK' }],
          'success'
        );
      }
    );
  };

  const handleCompleteOnboarding = () => {
    markOnboardingComplete();
    showAlert(
      'Onboarding Completed',
      'Welcome! You have completed the app setup.',
      [{ text: 'OK' }],
      'success'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your AI assistant experience</Text>
        </View>

        {/* Voice Settings */}
        <SettingsSection title="Voice & Speech" icon="mic">
          <SettingsItem
            title="Voice Assistant"
            subtitle="Enable voice interactions"
            type="switch"
            value={voiceSettings.enabled}
            onValueChange={(enabled) => updateVoiceSettings({ enabled })}
          />
          
          <SettingsItem
            title="Auto-Speak Responses"
            subtitle="Automatically speak AI responses"
            type="switch"
            value={voiceSettings.autoSpeak}
            onValueChange={(autoSpeak) => updateVoiceSettings({ autoSpeak })}
          />
          
          <SettingsItem
            title="Speech Rate"
            subtitle={`Current: ${voiceSettings.rate}x`}
            onPress={() => {
              // In a real implementation, this would open a slider modal
              showAlert('Speech Rate', 'Speech rate configuration coming soon!', [{ text: 'OK' }]);
            }}
          />
          
          <SettingsItem
            title="Voice Language"
            subtitle={voiceSettings.language}
            onPress={() => {
              // In a real implementation, this would open a language picker
              showAlert('Language', 'Language selection coming soon!', [{ text: 'OK' }]);
            }}
          />
        </SettingsSection>

        {/* Chat Settings */}
        <SettingsSection title="Chat & Interface" icon="chatbubbles">
          <SettingsItem
            title="Auto-Save Conversations"
            subtitle="Automatically save chat history"
            type="switch"
            value={chatSettings.autoSave}
            onValueChange={(autoSave) => updateChatSettings({ autoSave })}
          />
          
          <SettingsItem
            title="Show Timestamps"
            subtitle="Display message timestamps"
            type="switch"
            value={chatSettings.showTimestamps}
            onValueChange={(showTimestamps) => updateChatSettings({ showTimestamps })}
          />
          
          <SettingsItem
            title="Typing Indicator"
            subtitle="Show when AI is typing"
            type="switch"
            value={chatSettings.showTypingIndicator}
            onValueChange={(showTypingIndicator) => updateChatSettings({ showTypingIndicator })}
          />
          
          <SettingsItem
            title="Font Size"
            subtitle={`Current: ${chatSettings.fontSize}`}
            onPress={() => {
              // Cycle through font sizes
              const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
              const currentIndex = sizes.indexOf(chatSettings.fontSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              updateChatSettings({ fontSize: sizes[nextIndex] });
            }}
          />
          
          <SettingsItem
            title="Message History"
            subtitle={`Keep for ${chatSettings.messageHistory} days`}
            onPress={() => {
              showAlert('Message History', 'History duration configuration coming soon!', [{ text: 'OK' }]);
            }}
          />
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection title="Notifications" icon="notifications">
          <SettingsItem
            title="Enable Notifications"
            subtitle="Receive app notifications"
            type="switch"
            value={notificationSettings.enabled}
            onValueChange={(enabled) => updateNotificationSettings({ enabled })}
          />
          
          <SettingsItem
            title="Sound"
            subtitle="Notification sounds"
            type="switch"
            value={notificationSettings.sound}
            onValueChange={(sound) => updateNotificationSettings({ sound })}
          />
          
          <SettingsItem
            title="Vibration"
            subtitle="Vibrate for notifications"
            type="switch"
            value={notificationSettings.vibrate}
            onValueChange={(vibrate) => updateNotificationSettings({ vibrate })}
          />
          
          <SettingsItem
            title="Message Notifications"
            subtitle="Notify for new messages"
            type="switch"
            value={notificationSettings.messageNotifications}
            onValueChange={(messageNotifications) => updateNotificationSettings({ messageNotifications })}
          />
        </SettingsSection>

        {/* Privacy Settings */}
        <SettingsSection title="Privacy & Security" icon="shield-checkmark">
          <SettingsItem
            title="Encrypt Messages"
            subtitle="End-to-end encryption"
            type="switch"
            value={privacySettings.encryptMessages}
            onValueChange={(encryptMessages) => updatePrivacySettings({ encryptMessages })}
          />
          
          <SettingsItem
            title="Analytics"
            subtitle="Help improve the app"
            type="switch"
            value={privacySettings.collectAnalytics}
            onValueChange={(collectAnalytics) => updatePrivacySettings({ collectAnalytics })}
          />
          
          <SettingsItem
            title="Usage Data"
            subtitle="Share anonymous usage data"
            type="switch"
            value={privacySettings.shareUsageData}
            onValueChange={(shareUsageData) => updatePrivacySettings({ shareUsageData })}
          />
          
          <SettingsItem
            title="Cloud Sync"
            subtitle="Sync settings across devices"
            type="switch"
            value={privacySettings.cloudSync}
            onValueChange={(cloudSync) => updatePrivacySettings({ cloudSync })}
          />
        </SettingsSection>

        {/* Advanced Settings */}
        <SettingsSection title="Advanced" icon="cog">
          <SettingsItem
            title="Performance Dashboard"
            subtitle="View app performance metrics"
            onPress={() => setShowPerformanceDashboard(true)}
          />
          
          <SettingsItem
            title="Export Settings"
            subtitle="Save your settings to share or backup"
            onPress={handleExportSettings}
            rightElement={isExporting ? <LoadingSpinner size="small" /> : undefined}
          />
          
          <SettingsItem
            title="Import Settings"
            subtitle="Restore settings from backup"
            onPress={handleImportSettings}
          />
          
          <SettingsItem
            title="Reset to Defaults"
            subtitle="Reset all settings to default values"
            onPress={handleResetSettings}
          />
          
          {!hasCompletedOnboarding && (
            <SettingsItem
              title="Complete Onboarding"
              subtitle="Mark app setup as complete"
              onPress={handleCompleteOnboarding}
            />
          )}
        </SettingsSection>

        {/* App Information */}
        <SettingsSection title="About" icon="information-circle">
          <SettingsItem
            title="App Version"
            subtitle={version}
            type="info"
          />
          
          <SettingsItem
            title="Last Updated"
            subtitle={lastUpdated.toLocaleDateString()}
            type="info"
          />
          
          <SettingsItem
            title="Onboarding Status"
            subtitle={hasCompletedOnboarding ? 'Completed' : 'Pending'}
            type="info"
            rightElement={
              <View style={[
                styles.statusBadge,
                hasCompletedOnboarding ? styles.statusSuccess : styles.statusWarning
              ]}>
                <Text style={[
                  styles.statusText,
                  hasCompletedOnboarding ? styles.statusSuccessText : styles.statusWarningText
                ]}>
                  {hasCompletedOnboarding ? 'Complete' : 'Pending'}
                </Text>
              </View>
            }
          />
        </SettingsSection>

        {/* Footer Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Performance Dashboard Modal */}
      <PerformanceDashboard
        visible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusWarning: {
    backgroundColor: '#FFFBEB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusSuccessText: {
    color: '#065F46',
  },
  statusWarningText: {
    color: '#92400E',
  },
});

export default SettingsScreen;