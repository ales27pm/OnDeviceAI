import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { MemoryTab } from "./src/components/MemoryTab";
import { RagTab } from "./src/components/RagTab";
import { AgentTab } from "./src/components/AgentTab";

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
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;

              if (route.name === 'Memory') {
                iconName = focused ? 'library' : 'library-outline';
              } else if (route.name === 'RAG') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Agent') {
                iconName = focused ? 'cog' : 'cog-outline';
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
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
