import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface VoiceSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voiceId?: string;
  autoSpeak: boolean;
  language: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  messageNotifications: boolean;
  systemNotifications: boolean;
}

export interface ChatSettings {
  autoSave: boolean;
  messageHistory: number; // days to keep
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  bubbleStyle: 'modern' | 'classic' | 'minimal';
  showTimestamps: boolean;
  showTypingIndicator: boolean;
}

export interface PrivacySettings {
  collectAnalytics: boolean;
  shareUsageData: boolean;
  cloudSync: boolean;
  encryptMessages: boolean;
}

interface SettingsState {
  // Settings categories
  voice: VoiceSettings;
  notifications: NotificationSettings;
  chat: ChatSettings;
  privacy: PrivacySettings;
  
  // App metadata
  version: string;
  lastUpdated: Date;
  firstLaunch: Date;
  hasCompletedOnboarding: boolean;
  
  // Actions
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  
  // Utility actions
  resetToDefaults: () => void;
  markOnboardingComplete: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// Default settings
const defaultVoiceSettings: VoiceSettings = {
  enabled: true,
  rate: 0.5,
  pitch: 1.0,
  volume: 1.0,
  autoSpeak: false,
  language: 'en-US',
};

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  vibrate: true,
  messageNotifications: true,
  systemNotifications: true,
};

const defaultChatSettings: ChatSettings = {
  autoSave: true,
  messageHistory: 30,
  darkMode: false,
  fontSize: 'medium',
  bubbleStyle: 'modern',
  showTimestamps: true,
  showTypingIndicator: true,
};

const defaultPrivacySettings: PrivacySettings = {
  collectAnalytics: false,
  shareUsageData: false,
  cloudSync: false,
  encryptMessages: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      voice: defaultVoiceSettings,
      notifications: defaultNotificationSettings,
      chat: defaultChatSettings,
      privacy: defaultPrivacySettings,
      
      version: '1.0.0',
      lastUpdated: new Date(),
      firstLaunch: new Date(),
      hasCompletedOnboarding: false,

      // Actions
      updateVoiceSettings: (settings: Partial<VoiceSettings>) => {
        set(state => ({
          voice: { ...state.voice, ...settings },
          lastUpdated: new Date(),
        }));
      },

      updateNotificationSettings: (settings: Partial<NotificationSettings>) => {
        set(state => ({
          notifications: { ...state.notifications, ...settings },
          lastUpdated: new Date(),
        }));
      },

      updateChatSettings: (settings: Partial<ChatSettings>) => {
        set(state => ({
          chat: { ...state.chat, ...settings },
          lastUpdated: new Date(),
        }));
      },

      updatePrivacySettings: (settings: Partial<PrivacySettings>) => {
        set(state => ({
          privacy: { ...state.privacy, ...settings },
          lastUpdated: new Date(),
        }));
      },

      resetToDefaults: () => {
        set({
          voice: defaultVoiceSettings,
          notifications: defaultNotificationSettings,
          chat: defaultChatSettings,
          privacy: defaultPrivacySettings,
          lastUpdated: new Date(),
        });
      },

      markOnboardingComplete: () => {
        set({
          hasCompletedOnboarding: true,
          lastUpdated: new Date(),
        });
      },

      exportSettings: () => {
        const state = get();
        const exportData = {
          voice: state.voice,
          notifications: state.notifications,
          chat: state.chat,
          privacy: state.privacy,
          version: state.version,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
      },

      importSettings: (settingsJson: string) => {
        try {
          const imported = JSON.parse(settingsJson);
          
          // Validate structure
          if (!imported.voice || !imported.notifications || !imported.chat || !imported.privacy) {
            console.error('❌ Invalid settings format');
            return false;
          }
          
          set(state => ({
            voice: { ...defaultVoiceSettings, ...imported.voice },
            notifications: { ...defaultNotificationSettings, ...imported.notifications },
            chat: { ...defaultChatSettings, ...imported.chat },
            privacy: { ...defaultPrivacySettings, ...imported.privacy },
            lastUpdated: new Date(),
          }));
          
          console.log('✅ Settings imported successfully');
          return true;
        } catch (error) {
          console.error('❌ Failed to import settings:', error);
          return false;
        }
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Handle date deserialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.lastUpdated) {
            state.lastUpdated = new Date(state.lastUpdated);
          }
          if (state.firstLaunch) {
            state.firstLaunch = new Date(state.firstLaunch);
          }
        }
      },
    }
  )
);

// Selector hooks for better performance
export const useVoiceSettings = () => useSettingsStore(state => state.voice);
export const useNotificationSettings = () => useSettingsStore(state => state.notifications);
export const useChatSettings = () => useSettingsStore(state => state.chat);
export const usePrivacySettings = () => useSettingsStore(state => state.privacy);

export default useSettingsStore;