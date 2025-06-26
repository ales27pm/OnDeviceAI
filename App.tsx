import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { ModalProvider } from "./src/contexts/ModalContext";
import { MemoryTab } from "./src/components/MemoryTab";
import { RagTab } from "./src/components/RagTab";
import { AgentTab } from "./src/components/AgentTab";
import { VoiceEnhancedChatScreen } from "./src/screens/VoiceEnhancedChatScreen";
import { TestComponent } from "./src/components/TestComponent";
import { CalendarModuleDemo } from "./src/components/CalendarModuleDemo";
import { TurboSpeechDemo } from "./src/components/TurboSpeechDemo";
import WebIOSSimulator from "./src/components/WebIOSSimulator";
import { SettingsScreen } from "./src/screens/SettingsScreen";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ModalProvider>
          <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Chat') {
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              } else if (route.name === 'Memory') {
                iconName = focused ? 'library' : 'library-outline';
              } else if (route.name === 'RAG') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Agent') {
                iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
              } else if (route.name === 'Test') {
                iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              } else if (route.name === 'Calendar') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'TurboSpeech') {
                iconName = focused ? 'flash' : 'flash-outline';
              } else if (route.name === 'iOSSimulator') {
                iconName = focused ? 'phone-portrait' : 'phone-portrait-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else {
                iconName = 'help-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#6B7280',
            headerStyle: {
              backgroundColor: '#F9FAFB',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerTitle: () => (
              <Text className="text-xl font-bold text-gray-900">
                OnDeviceAI
              </Text>
            ),
          })}
        >
          <Tab.Screen 
            name="Chat" 
            component={VoiceEnhancedChatScreen}
            options={{
              tabBarLabel: 'Chat',
              headerTitle: 'AI Assistant',
              headerShown: false,
            }}
          />
          <Tab.Screen 
            name="Memory" 
            component={MemoryTab}
            options={{
              tabBarLabel: 'Memory',
              headerTitle: 'Memory Storage',
            }}
          />
          <Tab.Screen 
            name="RAG" 
            component={RagTab}
            options={{
              tabBarLabel: 'RAG',
              headerTitle: 'RAG Assistant',
            }}
          />
          <Tab.Screen 
            name="Agent" 
            component={AgentTab}
            options={{
              tabBarLabel: 'Agent',
              headerTitle: 'AI Agent',
            }}
          />
          <Tab.Screen 
            name="Test" 
            component={TestComponent}
            options={{
              tabBarLabel: 'Test',
              headerTitle: 'System Test',
            }}
          />
          <Tab.Screen 
            name="Calendar" 
            component={CalendarModuleDemo}
            options={{
              tabBarLabel: 'Calendar',
              headerTitle: 'Calendar Module',
            }}
          />
          <Tab.Screen 
            name="TurboSpeech" 
            component={TurboSpeechDemo}
            options={{
              tabBarLabel: 'Turbo',
              headerTitle: 'TurboModule Speech',
            }}
          />
          <Tab.Screen 
            name="iOSSimulator" 
            component={WebIOSSimulator}
            options={{
              tabBarLabel: 'iOS Sim',
              headerTitle: 'iOS Simulator',
              headerShown: false,
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              headerTitle: 'Settings',
              headerShown: false,
            }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
        </ModalProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}