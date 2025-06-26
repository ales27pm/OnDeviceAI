import React, { createContext, useContext } from 'react';
import { useCustomModal } from '../components/CustomModal';
import { usePromptModal } from '../components/PromptModal';

interface ModalContextType {
  showAlert: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm'
  ) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => void;
  showPrompt: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: (text: string) => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    options?: {
      placeholder?: string;
      defaultValue?: string;
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
      maxLength?: number;
      multiline?: boolean;
    }
  ) => Promise<string | null>;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showAlert, showConfirm, hideModal, modalComponent } = useCustomModal();
  const { prompt, promptComponent } = usePromptModal();

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt: prompt, hideModal }}>
      {children}
      {modalComponent}
      {promptComponent}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

// Drop-in replacement for Alert.alert
export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>,
    options?: { type?: 'info' | 'warning' | 'error' | 'success' | 'confirm' }
  ) => {
    // This will only work inside components wrapped with ModalProvider
    // For a global solution, we'll need to use a singleton pattern
    console.warn('Alert.alert called outside of ModalProvider context. Use useModal() hook instead.');
  }
};

export default ModalProvider;