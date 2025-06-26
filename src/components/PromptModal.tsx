import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Modal, 
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface PromptModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  buttons?: Array<{
    text: string;
    onPress?: (text: string) => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  maxLength?: number;
  multiline?: boolean;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  visible,
  onClose,
  title = '',
  message,
  placeholder = '',
  defaultValue = '',
  buttons = [
    { text: 'Cancel', style: 'cancel' },
    { text: 'OK' }
  ],
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  multiline = false
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setInputValue(defaultValue);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible, defaultValue, opacity, scale]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleButtonPress = (button: typeof buttons[0]) => {
    if (button.onPress) {
      button.onPress(inputValue);
    }
    onClose();
  };

  const handleCancel = () => {
    setInputValue(defaultValue);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <BlurView
            intensity={20}
            style={StyleSheet.absoluteFill}
          />
          
          <Pressable
            style={styles.backdrop}
            onPress={handleCancel}
          />

          <Animated.View style={[styles.modal, modalStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="create-outline" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.title}>{title}</Text>
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}
            </View>

            {/* Input Section */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  multiline && styles.multilineInput
                ]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                autoFocus={true}
                returnKeyType={multiline ? 'default' : 'done'}
                onSubmitEditing={() => {
                  if (!multiline) {
                    const submitButton = buttons.find(b => b.style !== 'cancel');
                    if (submitButton) {
                      handleButtonPress(submitButton);
                    }
                  }
                }}
              />
              
              {/* Character counter */}
              {maxLength && (
                <Text style={styles.characterCounter}>
                  {inputValue.length}/{maxLength}
                </Text>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    buttons.length === 1 && styles.singleButton,
                    index === 0 && buttons.length > 1 && styles.leftButton,
                    index === buttons.length - 1 && buttons.length > 1 && styles.rightButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Hook for managing prompt modal state
export const usePromptModal = () => {
  const [promptState, setPromptState] = useState<{
    visible: boolean;
    props: Partial<PromptModalProps>;
  }>({
    visible: false,
    props: {},
  });

  const showPrompt = React.useCallback((props: Partial<PromptModalProps>) => {
    setPromptState({
      visible: true,
      props,
    });
  }, []);

  const hidePrompt = React.useCallback(() => {
    setPromptState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const prompt = React.useCallback((
    title: string,
    message?: string,
    buttons?: PromptModalProps['buttons'],
    options?: {
      placeholder?: string;
      defaultValue?: string;
      secureTextEntry?: boolean;
      keyboardType?: PromptModalProps['keyboardType'];
      maxLength?: number;
      multiline?: boolean;
    }
  ) => {
    return new Promise<string | null>((resolve) => {
      const enhancedButtons = buttons?.map(button => ({
        ...button,
        onPress: (text: string) => {
          if (button.style === 'cancel') {
            resolve(null);
          } else {
            resolve(text);
          }
          if (button.onPress) {
            button.onPress(text);
          }
        }
      })) || [
        { 
          text: 'Cancel', 
          style: 'cancel' as const,
          onPress: () => resolve(null)
        },
        { 
          text: 'OK',
          onPress: (text: string) => resolve(text)
        }
      ];

      showPrompt({
        title,
        message,
        buttons: enhancedButtons,
        ...options,
      });
    });
  }, [showPrompt]);

  const promptComponent = (
    <PromptModal
      {...promptState.props}
      visible={promptState.visible}
      onClose={hidePrompt}
    />
  );

  return {
    showPrompt,
    hidePrompt,
    prompt,
    promptComponent,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    minWidth: Math.min(screenWidth - 48, 320),
    maxWidth: screenWidth - 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  singleButton: {
    borderRadius: 0,
  },
  leftButton: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
  },
  rightButton: {
    // No additional styling needed
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
  },
  destructiveButton: {
    backgroundColor: '#FEF2F2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  destructiveButtonText: {
    color: '#EF4444',
  },
});

export default PromptModal;