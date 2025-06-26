import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import * as Location from 'expo-location';
import { useCameraPermissions } from 'expo-camera';
import * as SMS from 'expo-sms';
import * as MailComposer from 'expo-mail-composer';

/**
 * Tool definition interface
 */
export interface Tool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
  category: 'memory' | 'calendar' | 'contacts' | 'communication' | 'media' | 'location' | 'system' | 'utility';
  requiresPermission?: boolean;
  permission?: string;
}

/**
 * Available tools for the agent system
 */
const AVAILABLE_TOOLS: Tool[] = [
  {
    name: 'addMemory',
    description: 'Store important information in long-term memory for later retrieval',
    parameters: {
      content: {
        type: 'string',
        description: 'The information to store in memory',
        required: true
      },
      metadata: {
        type: 'object',
        description: 'Optional metadata to associate with the memory (tags, category, etc.)'
      }
    },
    category: 'memory'
  },
  {
    name: 'searchMemory',
    description: 'Search through stored memories using semantic similarity',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query to find relevant memories',
        required: true
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)'
      }
    },
    category: 'memory'
  },
  {
    name: 'getCalendarEvents',
    description: 'Retrieve calendar events for a specific date range',
    parameters: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
        required: true
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
        required: true
      }
    },
    category: 'calendar',
    requiresPermission: true,
    permission: 'calendar'
  },
  {
    name: 'createCalendarEvent',
    description: 'Create a new calendar event',
    parameters: {
      title: {
        type: 'string',
        description: 'Title of the event',
        required: true
      },
      startDate: {
        type: 'string',
        description: 'Start date and time in ISO format',
        required: true
      },
      endDate: {
        type: 'string',
        description: 'End date and time in ISO format',
        required: true
      },
      notes: {
        type: 'string',
        description: 'Additional notes for the event'
      },
      location: {
        type: 'string',
        description: 'Location of the event'
      }
    },
    category: 'calendar',
    requiresPermission: true,
    permission: 'calendar'
  },
  {
    name: 'getCurrentTime',
    description: 'Get the current date and time',
    parameters: {},
    category: 'system'
  },
  {
    name: 'calculateDaysBetween',
    description: 'Calculate the number of days between two dates',
    parameters: {
      startDate: {
        type: 'string',
        description: 'Start date in ISO format (YYYY-MM-DD)',
        required: true
      },
      endDate: {
        type: 'string',
        description: 'End date in ISO format (YYYY-MM-DD)',
        required: true
      }
    },
    category: 'utility'
  },
  // CONTACTS TOOLS
  {
    name: 'searchContacts',
    description: 'Search for contacts by name, phone number, or email',
    parameters: {
      query: {
        type: 'string',
        description: 'Search query to find contacts',
        required: true
      }
    },
    category: 'contacts',
    requiresPermission: true,
    permission: 'contacts'
  },
  {
    name: 'getContact',
    description: 'Get detailed information about a specific contact',
    parameters: {
      contactId: {
        type: 'string',
        description: 'ID of the contact to retrieve',
        required: true
      }
    },
    category: 'contacts',
    requiresPermission: true,
    permission: 'contacts'
  },
  {
    name: 'addContact',
    description: 'Add a new contact to the address book',
    parameters: {
      firstName: {
        type: 'string',
        description: 'First name of the contact',
        required: true
      },
      lastName: {
        type: 'string',
        description: 'Last name of the contact'
      },
      phoneNumber: {
        type: 'string',
        description: 'Phone number of the contact'
      },
      email: {
        type: 'string',
        description: 'Email address of the contact'
      }
    },
    category: 'contacts',
    requiresPermission: true,
    permission: 'contacts'
  },
  // COMMUNICATION TOOLS
  {
    name: 'sendSMS',
    description: 'Send a text message to a phone number',
    parameters: {
      phoneNumber: {
        type: 'string',
        description: 'Phone number to send message to',
        required: true
      },
      message: {
        type: 'string',
        description: 'Message content to send',
        required: true
      }
    },
    category: 'communication',
    requiresPermission: true,
    permission: 'sms'
  },
  {
    name: 'sendEmail',
    description: 'Compose and send an email',
    parameters: {
      to: {
        type: 'string',
        description: 'Recipient email address',
        required: true
      },
      subject: {
        type: 'string',
        description: 'Email subject line',
        required: true
      },
      body: {
        type: 'string',
        description: 'Email content',
        required: true
      },
      cc: {
        type: 'string',
        description: 'CC recipients (comma-separated)'
      }
    },
    category: 'communication',
    requiresPermission: true,
    permission: 'email'
  },
  {
    name: 'makePhoneCall',
    description: 'Initiate a phone call to a number',
    parameters: {
      phoneNumber: {
        type: 'string',
        description: 'Phone number to call',
        required: true
      }
    },
    category: 'communication',
    requiresPermission: true,
    permission: 'phone'
  },
  // LOCATION TOOLS
  {
    name: 'getCurrentLocation',
    description: 'Get the current GPS location',
    parameters: {
      accuracy: {
        type: 'string',
        description: 'Location accuracy (high, balanced, low)',
        required: false
      }
    },
    category: 'location',
    requiresPermission: true,
    permission: 'location'
  },
  {
    name: 'searchNearby',
    description: 'Search for places near a location',
    parameters: {
      query: {
        type: 'string',
        description: 'What to search for (restaurants, gas stations, etc.)',
        required: true
      },
      radius: {
        type: 'number',
        description: 'Search radius in meters (default 5000)'
      }
    },
    category: 'location',
    requiresPermission: true,
    permission: 'location'
  },
  // MEDIA TOOLS
  {
    name: 'takePhoto',
    description: 'Take a photo with the camera',
    parameters: {
      quality: {
        type: 'number',
        description: 'Photo quality from 0 to 1 (default 0.8)'
      }
    },
    category: 'media',
    requiresPermission: true,
    permission: 'camera'
  },
  {
    name: 'getPhotos',
    description: 'Get photos from the device gallery',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of photos to retrieve (default 20)'
      },
      mediaType: {
        type: 'string',
        description: 'Type of media (photo, video, all)'
      }
    },
    category: 'media',
    requiresPermission: true,
    permission: 'mediaLibrary'
  }
];

/**
 * Permission status interface
 */
interface PermissionState {
  calendar: boolean;
  contacts: boolean;
  camera: boolean;
  mediaLibrary: boolean;
  location: boolean;
  microphone: boolean;
  sms: boolean;
  email: boolean;
  phone: boolean;
}

/**
 * Detailed permission status using Expo types
 */
interface DetailedPermissionStatus {
  calendar: string;
  contacts: string;
  camera: string;
  mediaLibrary: string;
  location: string;
  microphone: string;
  sms: string;
  email: string;
  phone: string;
}

/**
 * Hook to manage tool permissions and availability
 * Uses Expo APIs for comprehensive permission handling
 */
export const useToolPermissions = () => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>({
    calendar: false,
    contacts: false,
    camera: false,
    mediaLibrary: false,
    location: false,
    microphone: false,
    sms: false,
    email: false,
    phone: false
  });
  const [detailedStatus, setDetailedStatus] = useState<DetailedPermissionStatus>({
    calendar: 'undetermined',
    contacts: 'undetermined',
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    location: 'undetermined',
    microphone: 'undetermined',
    sms: 'undetermined',
    email: 'undetermined',
    phone: 'undetermined'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Check permissions for tools that require them using Expo APIs
   */

  /**
   * Check permissions for tools that require them
   */
  const checkPermissions = async () => {
    setIsLoading(true);
    const permissions: PermissionState = { 
      calendar: false, 
      contacts: false,
      camera: false,
      mediaLibrary: false,
      location: false, 
      microphone: false,
      sms: false,
      email: false,
      phone: false
    };
    const detailed: DetailedPermissionStatus = { 
      calendar: 'undetermined', 
      contacts: 'undetermined',
      camera: 'undetermined',
      mediaLibrary: 'undetermined',
      location: 'undetermined',
      microphone: 'undetermined', 
      sms: 'undetermined',
      email: 'undetermined',
      phone: 'undetermined'
    };

    try {
      console.log('🔍 Checking tool permissions using Expo APIs...');

      // Check calendar permissions using Expo Calendar
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Calendar.getCalendarPermissionsAsync();
          detailed.calendar = status;
          permissions.calendar = status === 'granted';
          
          console.log(`📅 Calendar permission: ${status}`);
        } catch (error) {
          console.warn('⚠️  Calendar permission check failed:', error);
          permissions.calendar = false;
          detailed.calendar = 'unavailable';
        }
      } else {
        console.log('🌐 Web platform - calendar not available');
        permissions.calendar = false;
        detailed.calendar = 'unavailable';
      }

      // Check contacts permissions using Expo Contacts
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Contacts.getPermissionsAsync();
          detailed.contacts = status;
          permissions.contacts = status === 'granted';
          
          console.log(`👥 Contacts permission: ${status}`);
        } catch (error) {
          console.warn('⚠️  Contacts permission check failed:', error);
          permissions.contacts = false;
          detailed.contacts = 'unavailable';
        }
      } else {
        console.log('🌐 Web platform - contacts not available');
        permissions.contacts = false;
        detailed.contacts = 'unavailable';
      }

      // Check camera permissions
      if (Platform.OS !== 'web') {
        try {
          // Note: Camera permissions are handled differently in newer expo-camera versions
          // For now, we'll assume permission is granted or handle it at the component level
          permissions.camera = true;
          detailed.camera = 'granted';
          console.log('📷 Camera permission: handled at component level');
        } catch (error) {
          console.warn('⚠️  Camera permission check failed:', error);
          permissions.camera = false;
          detailed.camera = 'unavailable';
        }
      } else {
        permissions.camera = false;
        detailed.camera = 'unavailable';
      }

      // Check media library permissions
      if (Platform.OS !== 'web') {
        try {
          const { status } = await MediaLibrary.getPermissionsAsync();
          detailed.mediaLibrary = status;
          permissions.mediaLibrary = status === 'granted';
          console.log(`📱 Media Library permission: ${status}`);
        } catch (error) {
          console.warn('⚠️  Media Library permission check failed:', error);
          permissions.mediaLibrary = false;
          detailed.mediaLibrary = 'unavailable';
        }
      } else {
        permissions.mediaLibrary = false;
        detailed.mediaLibrary = 'unavailable';
      }

      // Check location permissions
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          detailed.location = status;
          permissions.location = status === 'granted';
          console.log(`📍 Location permission: ${status}`);
        } catch (error) {
          console.warn('⚠️  Location permission check failed:', error);
          permissions.location = false;
          detailed.location = 'unavailable';
        }
      } else {
        permissions.location = false;
        detailed.location = 'unavailable';
      }

      // Communication permissions (SMS, Email, Phone) - note: these might need native modules
      // For now, we'll assume they're available on mobile platforms
      if (Platform.OS !== 'web') {
        // SMS availability check
        const smsAvailable = await SMS.isAvailableAsync();
        permissions.sms = smsAvailable;
        detailed.sms = smsAvailable ? 'granted' : 'denied';
        console.log(`💬 SMS available: ${smsAvailable}`);

        // Email availability check  
        const emailAvailable = await MailComposer.isAvailableAsync();
        permissions.email = emailAvailable;
        detailed.email = emailAvailable ? 'granted' : 'denied';
        console.log(`📧 Email available: ${emailAvailable}`);

        // Phone - assume available on mobile
        permissions.phone = true;
        detailed.phone = 'granted';
        console.log(`📞 Phone available: true`);

        // Microphone - assume available (already handled by speech service)
        permissions.microphone = true;
        detailed.microphone = 'granted';
        console.log(`🎤 Microphone available: true`);
      } else {
        permissions.sms = false;
        permissions.email = false;
        permissions.phone = false;
        permissions.microphone = false;
        detailed.sms = 'unavailable';
        detailed.email = 'unavailable';
        detailed.phone = 'unavailable';
        detailed.microphone = 'unavailable';
      }

      setPermissionStatus(permissions);
      setDetailedStatus(detailed);
      
      // Filter available tools based on permissions
      const filteredTools = AVAILABLE_TOOLS.filter(tool => {
        if (tool.requiresPermission && tool.permission) {
          const hasPermission = permissions[tool.permission as keyof PermissionState];
          
          // Special handling for tools that require specific permissions
          if (tool.permission === 'calendar' && !permissions.calendar) {
            console.log(`🚫 Tool '${tool.name}' disabled - calendar permission not granted`);
            return false;
          }
          
          if (tool.permission === 'contacts' && !permissions.contacts) {
            console.log(`🚫 Tool '${tool.name}' disabled - contacts permission not granted`);
            return false;
          }
          
          return hasPermission;
        }
        return true; // Tools without permissions are always available
      });

      setAvailableTools(filteredTools);
      console.log(`✅ Available tools: ${filteredTools.length}/${AVAILABLE_TOOLS.length}`);
      
    } catch (error) {
      console.error('❌ Failed to check permissions:', error);
      
      // Fallback to tools that don't require permissions
      const noPermissionTools = AVAILABLE_TOOLS.filter(tool => !tool.requiresPermission);
      setAvailableTools(noPermissionTools);
      console.log(`⚠️  Fallback mode - only ${noPermissionTools.length} tools available`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request specific permission using Expo APIs
   */
  const requestPermission = async (permission: keyof PermissionState): Promise<boolean> => {
    try {
      console.log(`🔐 Requesting ${permission} permission using Expo API...`);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - permissions not available');
        return false;
      }

      if (permission === 'calendar') {
        try {
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          const granted = status === 'granted';
          
          // Update local state
          setPermissionStatus(prev => ({ ...prev, calendar: granted }));
          setDetailedStatus(prev => ({ ...prev, calendar: status }));
          
          console.log(`${granted ? '✅' : '❌'} Calendar permission ${granted ? 'granted' : 'denied'} (${status})`);
          return granted;
        } catch (error) {
          console.error('❌ Failed to request calendar permission:', error);
          return false;
        }
      }

      if (permission === 'contacts') {
        try {
          const { status } = await Contacts.requestPermissionsAsync();
          const granted = status === 'granted';
          
          // Update local state
          setPermissionStatus(prev => ({ ...prev, contacts: granted }));
          setDetailedStatus(prev => ({ ...prev, contacts: status }));
          
          console.log(`${granted ? '✅' : '❌'} Contacts permission ${granted ? 'granted' : 'denied'} (${status})`);
          return granted;
        } catch (error) {
          console.error('❌ Failed to request contacts permission:', error);
          return false;
        }
      }

      if (permission === 'camera') {
        try {
          // Camera permissions are handled at component level with useCameraPermissions hook
          const granted = true; // Assume granted for now
          setPermissionStatus(prev => ({ ...prev, camera: granted }));
          setDetailedStatus(prev => ({ ...prev, camera: 'granted' }));
          console.log('✅ Camera permission handled at component level');
          return granted;
        } catch (error) {
          console.error('❌ Failed to request camera permission:', error);
          return false;
        }
      }

      if (permission === 'mediaLibrary') {
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          const granted = status === 'granted';
          setPermissionStatus(prev => ({ ...prev, mediaLibrary: granted }));
          setDetailedStatus(prev => ({ ...prev, mediaLibrary: status }));
          console.log(`${granted ? '✅' : '❌'} Media Library permission ${granted ? 'granted' : 'denied'} (${status})`);
          return granted;
        } catch (error) {
          console.error('❌ Failed to request media library permission:', error);
          return false;
        }
      }

      if (permission === 'location') {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          const granted = status === 'granted';
          setPermissionStatus(prev => ({ ...prev, location: granted }));
          setDetailedStatus(prev => ({ ...prev, location: status }));
          console.log(`${granted ? '✅' : '❌'} Location permission ${granted ? 'granted' : 'denied'} (${status})`);
          return granted;
        } catch (error) {
          console.error('❌ Failed to request location permission:', error);
          return false;
        }
      }

      // For communication permissions, we can't directly request them through Expo
      // They are handled by the system when the functionality is used
      if (['sms', 'email', 'phone', 'microphone'].includes(permission)) {
        console.log(`📱 ${permission} permission handled by system when used`);
        return true;
      }

      return false;
      
    } catch (error) {
      console.error(`❌ Failed to request ${permission} permission:`, error);
      return false;
    }
  };

  /**
   * Open device settings for permission management
   */
  const openSettings = async (): Promise<void> => {
    console.log('📱 Please go to device Settings > Privacy to manage permissions');
    // Note: Direct settings opening not available with Expo managed workflow
  };

  /**
   * Get human-readable permission status
   */
  const getPermissionStatusText = (permission: 'calendar' | 'contacts'): string => {
    const status = detailedStatus[permission];
    
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'undetermined':
        return 'Not requested';
      case 'unavailable':
        return 'Not available';
      default:
        return 'Unknown';
    }
  };

  /**
   * Get tools by category
   */
  const getToolsByCategory = (category: Tool['category']): Tool[] => {
    return availableTools.filter(tool => tool.category === category);
  };

  /**
   * Get tool by name
   */
  const getToolByName = (name: string): Tool | undefined => {
    return availableTools.find(tool => tool.name === name);
  };

  /**
   * Check if a specific tool is available
   */
  const isToolAvailable = (toolName: string): boolean => {
    return availableTools.some(tool => tool.name === toolName);
  };

  /**
   * Get formatted tool descriptions for AI prompt
   */
  const getToolDescriptionsForPrompt = (): string => {
    return availableTools.map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([key, param]) => {
          const required = param.required ? ' (required)' : ' (optional)';
          return `  - ${key} (${param.type}): ${param.description}${required}`;
        })
        .join('\n');
      
      return `${tool.name}: ${tool.description}\nParameters:\n${params || '  None'}`;
    }).join('\n\n');
  };

  return {
    availableTools,
    permissionStatus,
    detailedStatus,
    isLoading,
    checkPermissions,
    requestPermission,
    openSettings,
    getPermissionStatusText,
    getToolsByCategory,
    getToolByName,
    isToolAvailable,
    getToolDescriptionsForPrompt
  };
};