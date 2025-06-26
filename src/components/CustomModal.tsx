import React from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Modal, 
  Dimensions,
  StyleSheet 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  children?: React.ReactNode;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  buttons = [{ text: 'OK' }],
  type = 'info',
  children
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      case 'success': return 'checkmark-circle';
      case 'confirm': return 'help-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'success': return '#10B981';
      case 'confirm': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const handleButtonPress = (button: NonNullable<CustomModalProps['buttons']>[0]) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
        />
        
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />

        <Animated.View style={[styles.modal, modalStyle]}>
          {/* Header with icon */}
          {(title || type !== 'info') && (
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
                <Ionicons name={getIconName()} size={32} color={getIconColor()} />
              </View>
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {children ? children : (
              message && (
                <Text style={styles.message}>{message}</Text>
              )
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
    </Modal>
  );
};

// Helper hook for managing modal state
export const useCustomModal = () => {
  const [modalState, setModalState] = React.useState<{
    visible: boolean;
    props: Partial<CustomModalProps>;
  }>({
    visible: false,
    props: {},
  });

  const showModal = React.useCallback((props: Partial<CustomModalProps>) => {
    setModalState({
      visible: true,
      props,
    });
  }, []);

  const hideModal = React.useCallback(() => {
    setModalState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showAlert = React.useCallback((
    title: string,
    message?: string,
    buttons?: CustomModalProps['buttons'],
    type?: CustomModalProps['type']
  ) => {
    showModal({ title, message, buttons, type });
  }, [showModal]);

  const showConfirm = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal({
      title,
      message,
      type: 'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Confirm', onPress: onConfirm },
      ],
    });
  }, [showModal]);

  const modalComponent = (
    <CustomModal
      {...modalState.props}
      visible={modalState.visible}
      onClose={hideModal}
    />
  );

  return {
    showModal,
    hideModal,
    showAlert,
    showConfirm,
    modalComponent,
  };
};

const styles = StyleSheet.create({
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
    minWidth: Math.min(screenWidth - 48, 300),
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
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

export default CustomModal;