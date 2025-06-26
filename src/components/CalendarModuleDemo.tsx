import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import IOSCalendarModule, { CalendarEvent, Calendar as NativeCalendar } from '../modules/IOSCalendarModule';

export const CalendarModuleDemo: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [calendars, setCalendars] = useState<(NativeCalendar | Calendar.Calendar)[]>([]);
  const [events, setEvents] = useState<(CalendarEvent | Calendar.Event)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usingExpoCalendar, setUsingExpoCalendar] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
    setupEventListeners();
    
    return () => {
      IOSCalendarModule.removeAllListeners();
    };
  }, []);

  const setupEventListeners = () => {
    IOSCalendarModule.addEventListener('CalendarAccessGranted', () => {
      console.log('📅 Calendar access granted');
      setHasPermission(true);
      loadCalendars();
    });

    IOSCalendarModule.addEventListener('CalendarAccessDenied', (event) => {
      console.log('📅 Calendar access denied:', event);
      setHasPermission(false);
    });

    IOSCalendarModule.addEventListener('CalendarEventReminder', (event) => {
      console.log('📅 Calendar event reminder:', event);
      Alert.alert('Calendar Event', `Event created: ${event.event?.title}`);
    });
  };

  const checkPermissionStatus = async () => {
    try {
      // Check if native module is available, otherwise fall back to Expo Calendar
      if (Platform.OS === 'ios') {
        try {
          const status = await IOSCalendarModule.getCalendarPermissionStatus();
          setHasPermission(status.authorized);
          
          if (status.authorized) {
            loadCalendars();
            loadTodaysEvents();
          }
        } catch (nativeError) {
          console.warn('Native calendar not available, falling back to Expo Calendar');
          // Fall back to Expo Calendar
          const { status } = await Calendar.getCalendarPermissionsAsync();
          setHasPermission(status === 'granted');
          
          if (status === 'granted') {
            loadCalendarsExpo();
            loadTodaysEventsExpo();
          }
        }
      } else {
        // Use Expo Calendar for non-iOS platforms
        const { status } = await Calendar.getCalendarPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status === 'granted') {
          loadCalendarsExpo();
          loadTodaysEventsExpo();
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      let granted = false;
      
      if (Platform.OS === 'ios') {
        try {
          granted = await IOSCalendarModule.requestCalendarPermission();
        } catch (nativeError) {
          console.warn('Native calendar permission failed, trying Expo Calendar');
          // Fall back to Expo Calendar
          const { status } = await Calendar.requestCalendarPermissionsAsync();
          granted = status === 'granted';
          setUsingExpoCalendar(true);
        }
      } else {
        // Use Expo Calendar for non-iOS platforms
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        granted = status === 'granted';
        setUsingExpoCalendar(true);
      }
      
      setHasPermission(granted);
      
      if (granted) {
        if (usingExpoCalendar) {
          await loadCalendarsExpo();
          await loadTodaysEventsExpo();
        } else {
          await loadCalendars();
          await loadTodaysEvents();
        }
        Alert.alert('Success', 'Calendar access granted!');
      } else {
        Alert.alert('Permission Denied', 'Calendar access is required for this feature.');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Error', 'Failed to request calendar permission');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendars = async () => {
    try {
      const calendarList = await IOSCalendarModule.getCalendars();
      setCalendars(calendarList);
      console.log('📅 Loaded calendars:', calendarList.length);
    } catch (error) {
      console.error('Failed to load calendars:', error);
    }
  };

  const loadTodaysEvents = async () => {
    try {
      const todaysEvents = await IOSCalendarModule.getTodaysEvents();
      setEvents(todaysEvents);
      console.log('📅 Loaded today\'s events:', todaysEvents.length);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  // Expo Calendar fallback functions
  const loadCalendarsExpo = async () => {
    try {
      const calendarList = await Calendar.getCalendarsAsync();
      setCalendars(calendarList);
      setUsingExpoCalendar(true);
      console.log('📅 Loaded calendars (Expo):', calendarList.length);
    } catch (error) {
      console.error('Failed to load calendars (Expo):', error);
    }
  };

  const loadTodaysEventsExpo = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todaysEvents = await Calendar.getEventsAsync([], startOfDay, endOfDay);
      setEvents(todaysEvents);
      setUsingExpoCalendar(true);
      console.log('📅 Loaded today\'s events (Expo):', todaysEvents.length);
    } catch (error) {
      console.error('Failed to load today\'s events (Expo):', error);
    }
  };

  const createTestEvent = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant calendar permission first');
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 1); // 1 hour from now
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1); // 1 hour duration
      
      let event;
      if (usingExpoCalendar) {
        // Use Expo Calendar
        const defaultCalendar = calendars.find(cal => (cal as Calendar.Calendar).allowsModifications) || calendars[0];
        if (defaultCalendar) {
          const eventId = await Calendar.createEventAsync((defaultCalendar as Calendar.Calendar).id, {
            title: 'OnDeviceAI Test Event',
            location: 'Virtual Meeting',
            startDate: startDate,
            endDate: endDate,
            notes: 'Created by OnDeviceAI Expo calendar demo',
          });
          event = { id: eventId, title: 'OnDeviceAI Test Event' };
        }
      } else {
        // Use native calendar
        event = await IOSCalendarModule.createCalendarEvent({
          title: 'OnDeviceAI Test Event',
          location: 'Virtual Meeting',
          startDate: startDate,
          notes: 'Created by OnDeviceAI native calendar module demo',
        });
      }

      console.log('📅 Created event:', event);
      if (event) {
        Alert.alert('Success', `Event "${event.title || 'Untitled'}" created successfully!`);
      } else {
        Alert.alert('Success', 'Event created successfully!');
      }
      
      // Refresh today's events
      await loadTodaysEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', 'Failed to create calendar event');
    } finally {
      setIsLoading(false);
    }
  };

  const createQuickMeeting = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant calendar permission first');
      return;
    }

    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 2); // 2 hours from now
      
      const event = await IOSCalendarModule.createQuickEvent(
        'AI Team Meeting',
        startDate,
        30 // 30 minutes
      );

      console.log('📅 Created quick meeting:', event);
      Alert.alert('Meeting Scheduled', `"${event.title}" scheduled for 30 minutes`);
      
      await loadTodaysEvents();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      Alert.alert('Error', 'Failed to schedule meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const showUpcomingEvents = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant calendar permission first');
      return;
    }

    try {
      let upcomingEvents;
      if (usingExpoCalendar) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        upcomingEvents = await Calendar.getEventsAsync([], new Date(), nextWeek);
      } else {
        upcomingEvents = await IOSCalendarModule.getUpcomingEvents();
      }
      
      if (upcomingEvents.length === 0) {
        Alert.alert('No Events', 'No upcoming events found for the next 7 days');
        return;
      }

      const eventList = upcomingEvents
        .slice(0, 5) // Show first 5 events
        .map(event => {
          if (usingExpoCalendar) {
            const expoEvent = event as Calendar.Event;
            return `${expoEvent.title} (${new Date(expoEvent.startDate).toLocaleString()})`;
          } else {
            return IOSCalendarModule.formatEventForDisplay(event as CalendarEvent);
          }
        })
        .join('\n\n');

      Alert.alert(
        'Upcoming Events',
        `Next ${Math.min(upcomingEvents.length, 5)} events:\n\n${eventList}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to get upcoming events:', error);
      Alert.alert('Error', 'Failed to retrieve upcoming events');
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="phone-portrait-outline" size={64} color="#9CA3AF" />
          <Text style={styles.title}>iOS Only Feature</Text>
          <Text style={styles.subtitle}>
            Native Calendar Module is only available on iOS devices
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calendar Module Demo</Text>
          <Text style={styles.subtitle}>
            {usingExpoCalendar ? 'Expo Calendar Integration' : 'iOS Native EventKit Integration'}
          </Text>
          {usingExpoCalendar && (
            <Text style={styles.fallbackNote}>
              Using Expo Calendar (Native module unavailable)
            </Text>
          )}
        </View>

        {/* Permission Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permission Status</Text>
          <View style={[
            styles.statusCard,
            hasPermission ? styles.statusCardSuccess : styles.statusCardWarning
          ]}>
            <Ionicons 
              name={hasPermission ? "checkmark-circle" : "warning"} 
              size={24} 
              color={hasPermission ? "#10B981" : "#F59E0B"} 
            />
            <Text style={[
              styles.statusText,
              hasPermission ? styles.statusTextSuccess : styles.statusTextWarning
            ]}>
              {hasPermission ? 'Calendar Access Granted' : 'Calendar Access Required'}
            </Text>
          </View>
          
          {!hasPermission && (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={requestPermission}
              disabled={isLoading}
            >
              <Ionicons name="calendar" size={20} color="white" />
              <Text style={styles.buttonText}>
                {isLoading ? 'Requesting...' : 'Request Calendar Permission'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Calendar Info */}
        {hasPermission && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Calendars</Text>
              <Text style={styles.infoText}>
                Found {calendars.length} calendar{calendars.length !== 1 ? 's' : ''}
              </Text>
              {calendars.slice(0, 3).map((calendar, index) => (
                <View key={calendar.id} style={styles.calendarItem}>
                  <View style={[styles.calendarColor, { backgroundColor: typeof calendar.color === 'string' ? calendar.color : '#007AFF' }]} />
                  <Text style={styles.calendarName}>{calendar.title}</Text>
                  <Text style={styles.calendarSource}>({(calendar as any).source || 'Local'})</Text>
                </View>
              ))}
            </View>

            {/* Today's Events */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Events</Text>
              <Text style={styles.infoText}>
                {events.length} event{events.length !== 1 ? 's' : ''} today
              </Text>
              {events.length > 0 ? (
                events.slice(0, 3).map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {usingExpoCalendar 
                        ? new Date((event as Calendar.Event).startDate).toLocaleTimeString()
                        : IOSCalendarModule.formatEventForDisplay(event as CalendarEvent)
                      }
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No events scheduled for today</Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Actions</Text>
              
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={createTestEvent}
                disabled={isLoading}
              >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.buttonText}>Create Test Event</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={createQuickMeeting}
                disabled={isLoading}
              >
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.buttonText}>Schedule Quick Meeting</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.neutralButton]}
                onPress={showUpcomingEvents}
                disabled={isLoading}
              >
                <Ionicons name="calendar-outline" size={20} color="white" />
                <Text style={styles.buttonText}>View Upcoming Events</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.neutralButton]}
                onPress={() => {
                  loadTodaysEvents();
                  loadCalendars();
                }}
                disabled={isLoading}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Refresh Data</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Native iOS Calendar Integration via EventKit Framework
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  statusCardSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusCardWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextWarning: {
    color: '#D97706',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  neutralButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  calendarColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  calendarSource: {
    fontSize: 14,
    color: '#6B7280',
  },
  eventItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  fallbackNote: {
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default CalendarModuleDemo;