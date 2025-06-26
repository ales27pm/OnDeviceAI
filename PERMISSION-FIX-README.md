# Permission System Fix for OnDeviceAI

## Issue Resolution
Fixed the `TurboModuleRegistry.getEnforcing(...): 'RNPermissions' could not be found` error by migrating from `react-native-permissions` to Expo's built-in permission APIs.

## Changes Made

### 1. Updated useToolPermissions.ts
**Before:** Using `react-native-permissions`
```typescript
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
```

**After:** Using Expo APIs
```typescript
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
```

### 2. Permission Checking Logic
**Before:** Platform-specific permission constants
```typescript
const calendarPermission = Platform.OS === 'ios' 
  ? PERMISSIONS.IOS.CALENDARS 
  : PERMISSIONS.ANDROID.READ_CALENDAR;
const status = await check(calendarPermission);
```

**After:** Expo API calls
```typescript
const { status } = await Calendar.getCalendarPermissionsAsync();
const contactsResult = await Contacts.getPermissionsAsync();
```

### 3. Permission Request Logic
**Before:** react-native-permissions request
```typescript
const requestResult = await request(platformPermission);
const granted = requestResult === RESULTS.GRANTED;
```

**After:** Expo permission requests
```typescript
const { status } = await Calendar.requestCalendarPermissionsAsync();
const granted = status === 'granted';
```

## Benefits of Expo Permission System

### ✅ **Built-in Integration**
- No additional native linking required
- Works out-of-the-box with Expo managed workflow
- Consistent API across platforms

### ✅ **Simplified Implementation**
- Fewer dependencies to manage
- Direct API calls without platform checking
- Better integration with Expo ecosystem

### ✅ **Reliable Permission Handling**
- Status strings: 'granted', 'denied', 'undetermined', 'unavailable'
- Consistent behavior across iOS and Android
- Proper fallbacks for web platform

## Current Permission Support

### Calendar Permissions
```typescript
// Check permission
const { status } = await Calendar.getCalendarPermissionsAsync();

// Request permission
const { status } = await Calendar.requestCalendarPermissionsAsync();

// Status values: 'granted' | 'denied' | 'undetermined'
```

### Contacts Permissions
```typescript
// Check permission
const { status } = await Contacts.getPermissionsAsync();

// Request permission
const { status } = await Contacts.requestPermissionsAsync();

// Status values: 'granted' | 'denied' | 'undetermined'
```

### Cross-Platform Handling
```typescript
if (Platform.OS === 'web') {
  // Web fallback - permissions not available
  return { calendar: false, contacts: false };
}

// iOS and Android - use Expo APIs
const calendarStatus = await Calendar.getCalendarPermissionsAsync();
const contactsStatus = await Contacts.getPermissionsAsync();
```

## Tool Availability Logic

Tools are now filtered based on Expo permission status:

```typescript
const filteredTools = AVAILABLE_TOOLS.filter(tool => {
  if (tool.requiresPermission && tool.permission) {
    const hasPermission = permissions[tool.permission];
    
    if (tool.permission === 'calendar' && !permissions.calendar) {
      console.log(`🚫 Tool '${tool.name}' disabled - calendar permission not granted`);
      return false;
    }
    
    return hasPermission;
  }
  return true; // Tools without permissions are always available
});
```

## Error Resolution

### ✅ **TurboModule Error Fixed**
- No more `'RNPermissions' could not be found` errors
- Removed dependency on react-native-permissions
- Using Expo's native permission modules

### ✅ **Consistent API**
- Unified permission checking across all platforms
- Proper error handling and fallbacks
- Clear status reporting for users

### ✅ **Performance Benefits**
- Reduced bundle size (one less native dependency)
- Faster permission checking (direct Expo API calls)
- Better integration with Expo development workflow

## Usage Examples

### Check All Permissions
```typescript
const { permissionStatus, detailedStatus } = useToolPermissions();

console.log('Calendar:', permissionStatus.calendar); // boolean
console.log('Contacts:', permissionStatus.contacts); // boolean
console.log('Calendar Status:', detailedStatus.calendar); // 'granted' | 'denied' | etc.
```

### Request Permission
```typescript
const granted = await requestPermission('calendar');
if (granted) {
  console.log('✅ Calendar access granted');
} else {
  console.log('❌ Calendar access denied');
}
```

### Tool Availability
```typescript
const { availableTools, isToolAvailable } = useToolPermissions();

if (isToolAvailable('getCalendarEvents')) {
  // Calendar tools are available
} else {
  // Calendar permission not granted
}
```

The app now runs without permission-related errors and has a more robust, Expo-native permission system!