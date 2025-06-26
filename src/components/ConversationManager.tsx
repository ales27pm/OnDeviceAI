import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import { useChatStore, Conversation } from '../state/chatStore';
import { useModal } from '../contexts/ModalContext';
import { AnimatedView } from './AnimatedComponents';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConversationManagerProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

export const ConversationManager: React.FC<ConversationManagerProps> = ({
  visible,
  onClose,
  onSelectConversation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { showAlert, showConfirm, showPrompt } = useModal();
  
  const {
    getAllConversations,
    getArchivedConversations,
    createConversation,
    deleteConversation,
    archiveConversation,
    currentConversationId
  } = useChatStore();

  const [showArchived, setShowArchived] = useState(false);
  
  const conversations = showArchived ? getArchivedConversations() : getAllConversations();
  
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateConversation = async () => {
    const title = await showPrompt(
      'New Conversation',
      'Enter a title for your new conversation',
      undefined,
      {
        placeholder: 'Conversation title...',
        maxLength: 50
      }
    );

    if (title && title.trim()) {
      const id = createConversation(title.trim());
      onSelectConversation(id);
      onClose();
    }
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    showConfirm(
      'Delete Conversation',
      `Are you sure you want to permanently delete "${conversation.title}"? This action cannot be undone.`,
      () => {
        deleteConversation(conversation.id);
        if (currentConversationId === conversation.id) {
          // If deleting current conversation, create a new one
          const newId = createConversation();
          onSelectConversation(newId);
        }
      }
    );
  };

  const handleArchiveConversation = (conversation: Conversation) => {
    archiveConversation(conversation.id);
    showAlert(
      'Conversation Archived',
      `"${conversation.title}" has been moved to archived conversations.`,
      [{ text: 'OK' }],
      'success'
    );
  };

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation(conversation.id);
    onClose();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item: conversation, index }: { item: Conversation; index: number }) => {
    const isCurrentConversation = conversation.id === currentConversationId;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const messageCount = conversation.messages.length;

    return (
      <AnimatedView
        entering={FadeInDown.delay(index * 50)}
        exiting={FadeOutUp}
        animate={true}
        duration={300}
      >
        <Pressable
          style={[
            styles.conversationItem,
            isCurrentConversation && styles.currentConversationItem
          ]}
          onPress={() => handleSelectConversation(conversation)}
        >
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text 
                style={[
                  styles.conversationTitle,
                  isCurrentConversation && styles.currentConversationTitle
                ]}
                numberOfLines={1}
              >
                {conversation.title}
              </Text>
              <Text style={styles.conversationDate}>
                {formatDate(conversation.updatedAt)}
              </Text>
            </View>
            
            {lastMessage && (
              <Text style={styles.lastMessage} numberOfLines={2}>
                {lastMessage.role === 'user' ? 'You: ' : 'AI: '}
                {lastMessage.content}
              </Text>
            )}
            
            <View style={styles.conversationFooter}>
              <Text style={styles.messageCount}>
                {messageCount} message{messageCount !== 1 ? 's' : ''}
              </Text>
              
              {isCurrentConversation && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.conversationActions}>
            {!showArchived && (
              <Pressable
                style={styles.actionButton}
                onPress={() => handleArchiveConversation(conversation)}
              >
                <Ionicons name="archive-outline" size={20} color="#6B7280" />
              </Pressable>
            )}
            
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDeleteConversation(conversation)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        </Pressable>
      </AnimatedView>
    );
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
          <Text style={styles.headerTitle}>Conversations</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Toggle Archived */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              !showArchived && styles.activeToggle
            ]}
            onPress={() => setShowArchived(false)}
          >
            <Text style={[
              styles.toggleText,
              !showArchived && styles.activeToggleText
            ]}>
              Active ({getAllConversations().length})
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.toggleButton,
              showArchived && styles.activeToggle
            ]}
            onPress={() => setShowArchived(true)}
          >
            <Text style={[
              styles.toggleText,
              showArchived && styles.activeToggleText
            ]}>
              Archived ({getArchivedConversations().length})
            </Text>
          </Pressable>
        </View>

        {/* Conversations List */}
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          style={styles.conversationsList}
          contentContainerStyle={styles.conversationsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name={showArchived ? "archive-outline" : "chatbubbles-outline"} 
                size={64} 
                color="#D1D5DB" 
              />
              <Text style={styles.emptyTitle}>
                {showArchived ? 'No Archived Conversations' : 'No Conversations Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {showArchived 
                  ? 'Conversations you archive will appear here'
                  : 'Start a new conversation to begin chatting'
                }
              </Text>
            </View>
          }
        />

        {/* Create New Conversation Button */}
        {!showArchived && (
          <View style={styles.fabContainer}>
            <Pressable
              style={styles.fab}
              onPress={handleCreateConversation}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#374151',
  },
  conversationsList: {
    flex: 1,
  },
  conversationsContent: {
    paddingHorizontal: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentConversationItem: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  currentConversationTitle: {
    color: '#1D4ED8',
  },
  conversationDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  currentBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ConversationManager;