import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpeechService, VoiceProfile } from '../services/SpeechService';

interface VoiceSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  speechService: SpeechService;
  onVoiceSelected?: (voice: VoiceProfile) => void;
}

interface GroupedVoices {
  [language: string]: VoiceProfile[];
}

export const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
  visible,
  onClose,
  speechService,
  onVoiceSelected,
}) => {
  const [voiceInfo, setVoiceInfo] = useState<{
    current: VoiceProfile | null;
    available: VoiceProfile[];
    languages: string[];
    enhancedCount: number;
  }>({
    current: null,
    available: [],
    languages: [],
    enhancedCount: 0,
  });
  const [groupedVoices, setGroupedVoices] = useState<GroupedVoices>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadVoiceInfo();
    }
  }, [visible]);

  const loadVoiceInfo = () => {
    const info = speechService.getVoiceInfo();
    setVoiceInfo(info);

    // Group voices by language
    const grouped: GroupedVoices = {};
    info.available.forEach(voice => {
      const lang = voice.language;
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(voice);
    });

    // Sort voices within each language by quality and name
    Object.keys(grouped).forEach(lang => {
      grouped[lang].sort((a, b) => {
        if (a.quality === 'enhanced' && b.quality !== 'enhanced') return -1;
        if (a.quality !== 'enhanced' && b.quality === 'enhanced') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    setGroupedVoices(grouped);
  };

  const getFilteredVoices = (): VoiceProfile[] => {
    if (selectedLanguage === 'all') {
      return voiceInfo.available;
    }
    return groupedVoices[selectedLanguage] || [];
  };

  const testVoice = async (voice: VoiceProfile) => {
    setTestingVoice(voice.id);
    
    try {
      const originalVoice = speechService.getCurrentVoice();
      
      // Temporarily switch to test voice using robust selection
      let voiceSet = false;
      if (voice.identifier) {
        voiceSet = speechService.setVoice(voice.identifier);
      }
      if (!voiceSet && voice.id) {
        voiceSet = speechService.setVoice(voice.id);
      }
      if (!voiceSet && voice.name) {
        voiceSet = speechService.setVoice(voice.name);
      }
      
      if (!voiceSet) {
        throw new Error(`Could not set voice: ${voice.name}`);
      }
      
      await speechService.speak(`Hello, I'm ${voice.name}. This is how I sound in ${voice.language}.`, {
        onDone: () => {
          setTestingVoice(null);
          // Restore original voice using robust selection
          if (originalVoice) {
            if (originalVoice.identifier) {
              speechService.setVoice(originalVoice.identifier);
            } else if (originalVoice.id) {
              speechService.setVoice(originalVoice.id);
            } else if (originalVoice.name) {
              speechService.setVoice(originalVoice.name);
            }
          }
        },
        onError: (error) => {
          setTestingVoice(null);
          console.error('Voice test error:', error);
          Alert.alert('Test Failed', `Could not test ${voice.name}`);
          // Restore original voice
          if (originalVoice) {
            if (originalVoice.identifier) {
              speechService.setVoice(originalVoice.identifier);
            } else if (originalVoice.id) {
              speechService.setVoice(originalVoice.id);
            } else if (originalVoice.name) {
              speechService.setVoice(originalVoice.name);
            }
          }
        }
      });
    } catch (error) {
      setTestingVoice(null);
      console.error('Voice test error:', error);
      Alert.alert('Test Failed', `Could not test ${voice.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const selectVoice = (voice: VoiceProfile) => {
    console.log(`🎯 Selecting voice: ${voice.name} (ID: ${voice.id}, Identifier: ${voice.identifier})`);
    
    // Try different identifiers in order of preference
    let success = false;
    
    if (voice.identifier) {
      success = speechService.setVoice(voice.identifier);
    }
    
    if (!success && voice.id) {
      success = speechService.setVoice(voice.id);
    }
    
    if (!success && voice.name) {
      success = speechService.setVoice(voice.name);
    }
    
    if (success) {
      setVoiceInfo(prev => ({ ...prev, current: voice }));
      onVoiceSelected?.(voice);
      Alert.alert(
        'Voice Selected',
        `${voice.name} (${voice.language}) is now your voice assistant.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } else {
      console.error(`❌ Failed to select voice: ${voice.name}`);
      Alert.alert('Error', `Could not select ${voice.name}. Please try another voice.`);
    }
  };

  const renderVoiceItem = ({ item: voice }: { item: VoiceProfile }) => {
    const isSelected = voiceInfo.current?.id === voice.id;
    const isTesting = testingVoice === voice.id;

    return (
      <View style={[
        styles.voiceItem,
        isSelected && styles.selectedVoiceItem
      ]}>
        <View style={styles.voiceInfo}>
          <Text style={[
            styles.voiceName,
            isSelected && styles.selectedText
          ]}>
            {voice.name}
          </Text>
          <Text style={[
            styles.voiceDetails,
            isSelected && styles.selectedText
          ]}>
            {voice.language} • {voice.quality}
            {voice.quality === 'enhanced' && ' ✨'}
          </Text>
        </View>
        
        <View style={styles.voiceActions}>
          <Pressable
            style={[
              styles.actionButton,
              isTesting && styles.testingButton
            ]}
            onPress={() => testVoice(voice)}
            disabled={isTesting}
          >
            <Ionicons 
              name={isTesting ? "volume-high" : "play"} 
              size={16} 
              color={isTesting ? "#FF6B35" : "#007AFF"} 
            />
          </Pressable>
          
          {!isSelected && (
            <Pressable
              style={styles.actionButton}
              onPress={() => selectVoice(voice)}
            >
              <Ionicons name="checkmark" size={16} color="#34C759" />
            </Pressable>
          )}
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLanguageTab = (language: string) => {
    const isSelected = selectedLanguage === language;
    const count = language === 'all' ? voiceInfo.available.length : (groupedVoices[language]?.length || 0);
    
    return (
      <Pressable
        key={language}
        style={[
          styles.languageTab,
          isSelected && styles.selectedLanguageTab
        ]}
        onPress={() => setSelectedLanguage(language)}
      >
        <Text style={[
          styles.languageTabText,
          isSelected && styles.selectedLanguageTabText
        ]}>
          {language === 'all' ? 'All' : language} ({count})
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Voice</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </Pressable>
        </View>

        {/* Current Voice Info */}
        <View style={styles.currentVoiceContainer}>
          <Text style={styles.sectionTitle}>Current Voice</Text>
          {voiceInfo.current ? (
            <View style={styles.currentVoice}>
              <Ionicons name="person" size={20} color="#007AFF" />
              <Text style={styles.currentVoiceName}>
                {voiceInfo.current.name}
              </Text>
              <Text style={styles.currentVoiceDetails}>
                {voiceInfo.current.language} • {voiceInfo.current.quality}
              </Text>
            </View>
          ) : (
            <Text style={styles.noVoiceText}>No voice selected</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{voiceInfo.available.length}</Text>
            <Text style={styles.statLabel}>Total Voices</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{voiceInfo.languages.length}</Text>
            <Text style={styles.statLabel}>Languages</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{voiceInfo.enhancedCount}</Text>
            <Text style={styles.statLabel}>Enhanced ✨</Text>
          </View>
        </View>

        {/* Language Filter */}
        <View style={styles.languageFilterContainer}>
          <Text style={styles.sectionTitle}>Filter by Language</Text>
          <View style={styles.languageTabs}>
            {renderLanguageTab('all')}
            {voiceInfo.languages.slice(0, 4).map(renderLanguageTab)}
          </View>
        </View>

        {/* Voice List */}
        <FlatList
          data={getFilteredVoices()}
          renderItem={renderVoiceItem}
          keyExtractor={(item) => item.id}
          style={styles.voiceList}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  currentVoiceContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  currentVoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentVoiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  currentVoiceDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  noVoiceText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  languageFilterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  languageTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  selectedLanguageTab: {
    backgroundColor: '#007AFF',
  },
  languageTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedLanguageTabText: {
    color: 'white',
  },
  voiceList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  selectedVoiceItem: {
    backgroundColor: '#E6F3FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  voiceDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedText: {
    color: '#007AFF',
  },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testingButton: {
    backgroundColor: '#FFF0E6',
  },
  selectedIndicator: {
    marginLeft: 4,
  },
});

export default VoiceSelectionModal;