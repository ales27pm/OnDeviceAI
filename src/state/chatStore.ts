import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error' | 'speaking';
  isVoiceMessage?: boolean;
  audioLevel?: number;
  processingTime?: number;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

interface ChatState {
  // Current conversation
  currentConversationId: string | null;
  conversations: Record<string, Conversation>;
  
  // UI State (not persisted)
  isLoading: boolean;
  currentSpeakingId: string | null;
  isVoiceMode: boolean;
  
  // Actions
  createConversation: (title?: string) => string;
  setCurrentConversation: (id: string) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  clearConversation: (id?: string) => void;
  archiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  
  // UI Actions (not persisted)
  setLoading: (loading: boolean) => void;
  setCurrentSpeakingId: (id: string | null) => void;
  setVoiceMode: (enabled: boolean) => void;
  
  // Getters
  getCurrentConversation: () => Conversation | null;
  getConversationMessages: (id?: string) => ChatMessage[];
  getAllConversations: () => Conversation[];
  getArchivedConversations: () => Conversation[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createConversationTitle = (firstMessage?: string): string => {
  if (!firstMessage) return `Chat ${new Date().toLocaleDateString()}`;
  
  const words = firstMessage.split(' ').slice(0, 4);
  return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentConversationId: null,
      conversations: {},
      isLoading: false,
      currentSpeakingId: null,
      isVoiceMode: false,

      // Actions
      createConversation: (title?: string) => {
        const id = generateId();
        const conversation: Conversation = {
          id,
          title: title || `New Chat`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        };

        set(state => ({
          conversations: {
            ...state.conversations,
            [id]: conversation,
          },
          currentConversationId: id,
        }));

        return id;
      },

      setCurrentConversation: (id: string) => {
        const conversation = get().conversations[id];
        if (conversation) {
          set({ currentConversationId: id });
        }
      },

      addMessage: (messageData) => {
        const state = get();
        let conversationId = state.currentConversationId;

        // Create new conversation if none exists
        if (!conversationId) {
          conversationId = get().createConversation();
        }

        const conversation = state.conversations[conversationId];
        if (!conversation) return '';

        const messageId = generateId();
        const message: ChatMessage = {
          ...messageData,
          id: messageId,
          timestamp: new Date(),
          conversationId,
        };

        const updatedMessages = [...conversation.messages, message];
        
        // Update conversation title if this is the first user message
        let updatedTitle = conversation.title;
        if (conversation.messages.length === 0 && messageData.role === 'user') {
          updatedTitle = createConversationTitle(messageData.content);
        }

        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              title: updatedTitle,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        }));

        return messageId;
      },

      updateMessage: (id: string, updates: Partial<ChatMessage>) => {
        const state = get();
        const conversationId = state.currentConversationId;
        if (!conversationId) return;

        const conversation = state.conversations[conversationId];
        if (!conversation) return;

        const updatedMessages = conversation.messages.map(msg =>
          msg.id === id ? { ...msg, ...updates } : msg
        );

        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        }));
      },

      deleteMessage: (id: string) => {
        const state = get();
        const conversationId = state.currentConversationId;
        if (!conversationId) return;

        const conversation = state.conversations[conversationId];
        if (!conversation) return;

        const updatedMessages = conversation.messages.filter(msg => msg.id !== id);

        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        }));
      },

      clearConversation: (id?: string) => {
        const conversationId = id || get().currentConversationId;
        if (!conversationId) return;

        const conversation = get().conversations[conversationId];
        if (!conversation) return;

        set(state => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: [],
              updatedAt: new Date(),
            },
          },
        }));
      },

      archiveConversation: (id: string) => {
        const conversation = get().conversations[id];
        if (!conversation) return;

        set(state => ({
          conversations: {
            ...state.conversations,
            [id]: {
              ...conversation,
              isArchived: true,
              updatedAt: new Date(),
            },
          },
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      deleteConversation: (id: string) => {
        const { [id]: deleted, ...remainingConversations } = get().conversations;
        
        set(state => ({
          conversations: remainingConversations,
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      // UI Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setCurrentSpeakingId: (id: string | null) => set({ currentSpeakingId: id }),
      setVoiceMode: (enabled: boolean) => set({ isVoiceMode: enabled }),

      // Getters
      getCurrentConversation: () => {
        const state = get();
        return state.currentConversationId ? state.conversations[state.currentConversationId] : null;
      },

      getConversationMessages: (id?: string) => {
        const conversationId = id || get().currentConversationId;
        if (!conversationId) return [];
        
        const conversation = get().conversations[conversationId];
        return conversation ? conversation.messages : [];
      },

      getAllConversations: () => {
        return Object.values(get().conversations)
          .filter(conv => !conv.isArchived)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      },

      getArchivedConversations: () => {
        return Object.values(get().conversations)
          .filter(conv => conv.isArchived)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist conversations and currentConversationId, not UI state
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
        conversations: state.conversations,
      }),
      // Handle date deserialization
      onRehydrateStorage: () => (state) => {
        if (state?.conversations) {
          Object.values(state.conversations).forEach((conversation: any) => {
            conversation.createdAt = new Date(conversation.createdAt);
            conversation.updatedAt = new Date(conversation.updatedAt);
            conversation.messages.forEach((message: any) => {
              message.timestamp = new Date(message.timestamp);
            });
          });
        }
      },
    }
  )
);

export default useChatStore;