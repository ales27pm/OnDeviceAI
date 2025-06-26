import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useSettingsStore } from '../state/settingsStore';
import { useModal } from '../contexts/ModalContext';
import { AnimatedView, SlideView } from '../components/AnimatedComponents';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingPageProps {
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features?: string[];
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({
  title,
  subtitle,
  description,
  icon,
  color,
  features = []
}) => (
  <View style={styles.page}>
    <AnimatedView style={styles.pageContent} entering={FadeInUp.delay(200)}>
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={64} color={color} />
      </View>

      {/* Title */}
      <AnimatedView entering={FadeInUp.delay(400)}>
        <Text style={styles.pageTitle}>{title}</Text>
      </AnimatedView>

      {/* Subtitle */}
      <AnimatedView entering={FadeInUp.delay(600)}>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </AnimatedView>

      {/* Description */}
      <AnimatedView entering={FadeInUp.delay(800)}>
        <Text style={styles.pageDescription}>{description}</Text>
      </AnimatedView>

      {/* Features */}
      {features.length > 0 && (
        <AnimatedView style={styles.featuresContainer} entering={FadeInDown.delay(1000)}>
          {features.map((feature, index) => (
            <AnimatedView 
              key={index} 
              style={styles.featureItem}
              entering={FadeInDown.delay(1200 + index * 100)}
            >
              <View style={[styles.featureDot, { backgroundColor: color }]} />
              <Text style={styles.featureText}>{feature}</Text>
            </AnimatedView>
          ))}
        </AnimatedView>
      )}
    </AnimatedView>
  </View>
);

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const { markOnboardingComplete } = useSettingsStore();
  const { showAlert } = useModal();

  const pages: OnboardingPageProps[] = [
    {
      title: "Welcome to AI Assistant",
      subtitle: "Your intelligent companion",
      description: "Experience the power of AI-driven conversations with advanced voice capabilities and smart assistance.",
      icon: "chatbubbles",
      color: "#3B82F6",
      features: [
        "Natural conversation flow",
        "Voice interaction support",
        "Context-aware responses",
        "Multi-modal capabilities"
      ]
    },
    {
      title: "Voice-Powered Conversations",
      subtitle: "Speak naturally, get intelligent responses",
      description: "Use your voice to interact with the AI assistant. Speak your questions and get spoken responses back.",
      icon: "mic",
      color: "#10B981",
      features: [
        "Speech-to-text transcription",
        "Text-to-speech responses",
        "Multiple voice options",
        "Real-time audio processing"
      ]
    },
    {
      title: "Smart Features",
      subtitle: "Enhanced productivity tools",
      description: "Access web search, file uploads, conversation management, and personalized settings.",
      icon: "bulb",
      color: "#F59E0B",
      features: [
        "Web search integration",
        "File upload and analysis",
        "Conversation history",
        "Customizable settings"
      ]
    },
    {
      title: "Privacy & Security",
      subtitle: "Your data, your control",
      description: "We prioritize your privacy with local processing, encrypted storage, and transparent data handling.",
      icon: "shield-checkmark",
      color: "#8B5CF6",
      features: [
        "Local message encryption",
        "No data tracking by default",
        "Transparent privacy settings",
        "Secure cloud sync (optional)"
      ]
    },
    {
      title: "Get Started",
      subtitle: "Ready to begin your AI journey?",
      description: "You're all set! Start chatting with your AI assistant and explore all the features at your own pace.",
      icon: "rocket",
      color: "#EF4444",
      features: [
        "Start with simple questions",
        "Try voice interactions",
        "Explore settings panel",
        "Manage conversations"
      ]
    }
  ];

  const handlePageChange = (event: any) => {
    setCurrentPage(event.nativeEvent.position);
  };

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      pagerRef.current?.setPage(currentPage - 1);
    }
  };

  const handleComplete = () => {
    markOnboardingComplete();
    showAlert(
      "Welcome!",
      "You've completed the onboarding. Enjoy exploring your AI assistant!",
      [{ text: "Let's Go!", onPress: onComplete }],
      "success"
    );
  };

  const handleSkip = () => {
    markOnboardingComplete();
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Page Indicator */}
      <View style={styles.indicatorContainer}>
        {pages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentPage && styles.activeIndicator
            ]}
          />
        ))}
      </View>

      {/* Pages */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageChange}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.pageContainer}>
            <OnboardingPage {...page} />
          </View>
        ))}
      </PagerView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <Pressable
          style={[
            styles.navButton,
            currentPage === 0 && styles.navButtonDisabled
          ]}
          onPress={goToPreviousPage}
          disabled={currentPage === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={currentPage === 0 ? "#D1D5DB" : "#374151"} 
          />
        </Pressable>

        <View style={styles.pageCounter}>
          <Text style={styles.pageCounterText}>
            {currentPage + 1} of {pages.length}
          </Text>
        </View>

        <Pressable
          style={[
            styles.navButton,
            currentPage === pages.length - 1 ? styles.completeButton : styles.nextButton
          ]}
          onPress={goToNextPage}
        >
          {currentPage === pages.length - 1 ? (
            <>
              <Text style={styles.completeButtonText}>Complete</Text>
              <Ionicons name="checkmark" size={20} color="white" />
            </>
          ) : (
            <Ionicons name="chevron-forward" size={24} color="white" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pageContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  pageDescription: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: 'auto',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  pageCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pageCounterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default OnboardingScreen;