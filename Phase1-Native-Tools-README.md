# OnDeviceAI - Phase 1: Native Tools & Permissions

## Overview
This phase implements native iOS calendar functionality using TurboModules with the React Native New Architecture, along with comprehensive permission handling using react-native-permissions.

## Phase 1 Extension - Native Tools & Permissions ✅

### 8. CalendarModule TurboModule Specification
Located at `src/native/NativeCalendar.ts`

**Features:**
- ✅ Complete TurboModule interface definition
- ✅ TypeScript type safety with proper interfaces
- ✅ EventKit integration specification
- ✅ Codegen-compatible annotations

**Key Methods:**
```typescript
interface Spec extends TurboModule {
  requestPermission(): Promise<boolean>;
  createEvent(title: string, isoDate: string, location?: string): Promise<string>;
  listEvents(isoDate: string): Promise<CalendarEvent[]>;
  updateEvent(eventId: string, title: string, isoDate: string, location?: string): Promise<boolean>;
  deleteEvent(eventId: string): Promise<boolean>;
  getPermissionStatus(): Promise<string>;
}
```

### 9. Native iOS Implementation
Located at `ios/OnDeviceAI/CalendarModule.swift`

**Features:**
- ✅ Full EventKit framework integration
- ✅ iOS 17+ compatibility with fallback for older versions
- ✅ Comprehensive permission handling (authorized, fullAccess, writeOnly, etc.)
- ✅ Proper date parsing and validation
- ✅ Error handling with specific error codes
- ✅ Support for both legacy and new architecture

**Key Capabilities:**
- **Permission Management**: Handles all EventKit authorization states
- **Event CRUD**: Create, read, update, delete calendar events
- **Date Handling**: ISO 8601 date parsing and formatting
- **Error Handling**: Detailed error reporting with proper rejection codes
- **iOS Version Support**: Compatible with iOS 14+ with iOS 17+ optimizations

### 10. Objective-C++ Bridge
Located at `ios/OnDeviceAI/CalendarModule.mm`

**Features:**
- ✅ Complete RCT_EXTERN_MODULE bridge implementation
- ✅ All Swift methods properly exposed to React Native
- ✅ TurboModule support for new architecture
- ✅ Legacy architecture compatibility

**Bridge Methods:**
```objc
RCT_EXTERN_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createEvent:(NSString *)title isoDate:(NSString *)isoDate location:(NSString *)location ...)
RCT_EXTERN_METHOD(listEvents:(NSString *)isoDate resolver:(RCTPromiseResolveBlock)resolve ...)
// ... and more
```

### 11. Enhanced Permission System
Located at `src/hooks/useToolPermissions.ts`

**Features:**
- ✅ react-native-permissions integration
- ✅ Cross-platform permission handling (iOS/Android/Web)
- ✅ Detailed permission status reporting
- ✅ Graceful fallbacks for unsupported platforms
- ✅ Comprehensive logging and error handling

**Permission States Handled:**
- `GRANTED` - Full access allowed
- `DENIED` - Access denied by user
- `BLOCKED` - Permanently blocked, requires Settings
- `UNAVAILABLE` - Feature not available on device
- `LIMITED` - Partial access (iOS 14+)

**Key Methods:**
```typescript
const {
  availableTools,
  permissionStatus,
  detailedStatus,
  requestPermission,
  openSettings,
  getPermissionStatusText
} = useToolPermissions();
```

## Native Calendar Module Wrapper
Located at `src/modules/NativeCalendarModule.ts`

**Features:**
- ✅ High-level TypeScript wrapper over native TurboModule
- ✅ Cross-platform compatibility with graceful web fallbacks
- ✅ Enhanced error handling and validation
- ✅ Convenient date range operations
- ✅ Permission status checking and management

**Key Features:**
```typescript
const calendarModule = NativeCalendarModule.getInstance();

// Permission management
await calendarModule.requestPermission();
const status = await calendarModule.getPermissionStatus();

// Event operations
const eventId = await calendarModule.createEvent("Meeting", "2025-01-20T10:00:00", "Office");
const events = await calendarModule.getEventsForDate("2025-01-20");
const todaysEvents = await calendarModule.getTodaysEvents();
```

## Configuration Files

### Package.json Configuration
```json
{
  "codegenConfig": {
    "name": "OnDeviceAISpec",
    "type": "modules", 
    "jsSrcsDir": "src/native",
    "android": {
      "javaPackageName": "com.ondeviceai.nativemodules"
    }
  }
}
```

### iOS Podfile Configuration
Located at `ios/Podfile-TurboModule-Config.rb`

**Required Dependencies:**
- EventKit framework for calendar access
- TurboModule codegen support
- Privacy permissions configuration

### Info.plist Entries
Located at `ios/Info-plist-additions.xml`

**Required Permissions:**
```xml
<key>NSCalendarsUsageDescription</key>
<string>OnDeviceAI needs access to your calendar to create and manage events...</string>

<key>NSCalendarsFullAccessUsageDescription</key>
<string>OnDeviceAI needs full calendar access for intelligent scheduling...</string>
```

## Integration with AI Agent System

### Enhanced AgentExecutor
The AgentExecutor now supports:
- ✅ Native calendar integration with fallback to legacy module
- ✅ Improved calendar event creation and retrieval
- ✅ Better error handling and permission checking
- ✅ Cross-platform compatibility

### Updated Tool System
Tools now include:
- **Native Calendar Tools**: Direct EventKit integration
- **Permission-Aware Tools**: Dynamic availability based on granted permissions
- **Cross-Platform Tools**: Graceful degradation on unsupported platforms

## Usage Examples

### Basic Calendar Operations
```typescript
import { NativeCalendarModule } from './src/modules/NativeCalendarModule';

const calendar = NativeCalendarModule.getInstance();

// Initialize and request permission
await calendar.initialize();
const hasPermission = await calendar.requestPermission();

if (hasPermission) {
  // Create an event
  const eventId = await calendar.createEvent(
    "Team Meeting",
    "2025-01-20T14:00:00",
    "2025-01-20T15:00:00",
    "Conference Room A"
  );

  // Get today's events
  const todaysEvents = await calendar.getTodaysEvents();
  console.log(`Today: ${todaysEvents.length} events`);
}
```

### Permission Management
```typescript
import { useToolPermissions } from './src/hooks/useToolPermissions';

const PermissionExample = () => {
  const { 
    permissionStatus, 
    detailedStatus, 
    requestPermission, 
    getPermissionStatusText 
  } = useToolPermissions();

  const handleRequestCalendar = async () => {
    const granted = await requestPermission('calendar');
    if (granted) {
      console.log('Calendar access granted!');
    } else {
      console.log('Calendar access denied');
    }
  };

  return (
    <View>
      <Text>Calendar: {getPermissionStatusText('calendar')}</Text>
      <Button title="Request Calendar" onPress={handleRequestCalendar} />
    </View>
  );
};
```

### AI Agent Integration
```typescript
import { AgentExecutor } from './src/agents/AgentExecutor';
import { useToolPermissions } from './src/hooks/useToolPermissions';

const AgentExample = () => {
  const { availableTools } = useToolPermissions();
  const agent = new AgentExecutor(availableTools);

  const runAgent = async () => {
    const result = await agent.run(
      "Create a meeting for tomorrow at 2 PM and show me my calendar for this week"
    );
    console.log('Agent response:', result.finalAnswer);
  };
};
```

## Architecture Benefits

### TurboModule Advantages
- **Performance**: Direct native module communication without bridge serialization
- **Type Safety**: Full TypeScript support with codegen
- **New Architecture**: Ready for React Native's future
- **Synchronous Calls**: Support for synchronous native operations when needed

### Permission System Benefits
- **Comprehensive**: Handles all permission states across platforms
- **User-Friendly**: Clear status messages and settings guidance
- **Robust**: Graceful fallbacks for unsupported scenarios
- **Integrated**: Seamlessly works with AI agent tool system

### Cross-Platform Strategy
- **iOS**: Full native EventKit integration with TurboModules
- **Android**: Ready for native implementation (can extend with similar approach)
- **Web**: Graceful fallbacks with clear messaging
- **Universal**: Same API surface across all platforms

## Next Steps

### Phase 2 - Android Native Implementation
- Implement Android calendar TurboModule using CalendarContract
- Add Android-specific permissions handling
- Extend cross-platform wrapper

### Phase 3 - Additional Native Tools
- Contacts integration with TurboModules
- Location services with privacy-first approach
- Camera and photo library access
- Push notifications and local notifications

### Phase 4 - Advanced Features
- Calendar event intelligence and conflict detection
- Smart scheduling suggestions
- Multi-calendar support and synchronization
- Recurring event pattern recognition

## Testing

### Manual Testing
1. **Permission Flow**: Test permission request and status checking
2. **Event Operations**: Create, read, update, delete calendar events
3. **Cross-Platform**: Verify graceful fallbacks on web
4. **AI Integration**: Test agent calendar operations

### Automated Testing
```typescript
import { NativeCalendarModule } from './src/modules/NativeCalendarModule';

describe('Native Calendar Module', () => {
  it('should request permission successfully', async () => {
    const calendar = NativeCalendarModule.getInstance();
    const hasPermission = await calendar.requestPermission();
    expect(typeof hasPermission).toBe('boolean');
  });

  it('should create and retrieve events', async () => {
    const calendar = NativeCalendarModule.getInstance();
    const eventId = await calendar.createEvent("Test Event", "2025-01-20T10:00:00");
    expect(eventId).toBeDefined();
    
    const events = await calendar.getEventsForDate("2025-01-20");
    expect(events.length).toBeGreaterThan(0);
  });
});
```

The OnDeviceAI app now has complete native calendar integration with TurboModules, comprehensive permission handling, and seamless AI agent integration!