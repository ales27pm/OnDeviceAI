/**
 * Native Calendar Module JavaScript Interface
 * 
 * This exposes the native iOS CalendarModule as a TypeScript module with
 * comprehensive calendar functionality using iOS EventKit framework.
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { CalendarModule } = NativeModules;
const NativeCalendar = CalendarModule;

/**
 * Basic calendar event interface
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
}

/**
 * Calendar event interface with extended properties
 */
export interface CalendarEventExtended extends CalendarEvent {
  location?: string;
  notes?: string;
  allDay?: boolean;
  endDate?: string;
}

/**
 * Native Calendar Module wrapper
 * Provides a high-level interface over the native TurboModule
 * with error handling and cross-platform compatibility
 */
export class NativeCalendarModule {
  private static instance: NativeCalendarModule | null = null;
  private permissionStatus: string = 'notDetermined';

  private constructor() {}

  /**
   * Gets the singleton instance
   */
  static getInstance(): NativeCalendarModule {
    if (!this.instance) {
      this.instance = new NativeCalendarModule();
    }
    return this.instance;
  }

  /**
   * Initialize the calendar module
   */
  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('Native calendar functionality is not available on web platform');
    }

    try {
      // Check if native module is available
      if (!NativeCalendar) {
        throw new Error('Native calendar module not available');
      }

      // Check initial permission status
      this.permissionStatus = await NativeCalendar.getPermissionStatus();
      console.log('🗓️  Native Calendar Module initialized, permission status:', this.permissionStatus);
    } catch (error) {
      console.warn('⚠️  Native Calendar Module not available, falling back to Expo Calendar');
      // Set status to indicate native module is not available
      this.permissionStatus = 'unavailable';
      throw new Error('Native calendar module not available - using Expo Calendar fallback');
    }
  }

  /**
   * Request calendar permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.warn('Calendar permissions not available on web');
      return false;
    }

    try {
      const granted = await NativeCalendar.requestPermission();
      
      if (granted) {
        this.permissionStatus = await NativeCalendar.getPermissionStatus();
        console.log('✅ Calendar permission granted, status:', this.permissionStatus);
      } else {
        console.log('❌ Calendar permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Failed to request calendar permission:', error);
      throw new Error(`Failed to request calendar permission: ${error}`);
    }
  }

  /**
   * Get current permission status
   */
  async getPermissionStatus(): Promise<string> {
    if (Platform.OS === 'web') {
      return 'unavailable';
    }

    try {
      this.permissionStatus = await NativeCalendar.getPermissionStatus();
      return this.permissionStatus;
    } catch (error) {
      console.error('❌ Failed to get permission status:', error);
      return 'error';
    }
  }

  /**
   * Check if calendar operations are allowed
   */
  private async ensurePermission(): Promise<void> {
    const status = await this.getPermissionStatus();
    
    if (status !== 'authorized' && status !== 'fullAccess') {
      throw new Error(`Calendar access not authorized. Status: ${status}`);
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(
    title: string,
    startDate: string,
    endDate?: string,
    location?: string
  ): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event creation not available on web');
    }

    await this.ensurePermission();

    try {
      // Use startDate as the ISO date for the native module
      const eventId = await NativeCalendar.createEvent(title, startDate, location);
      console.log('✅ Calendar event created:', eventId);
      return eventId;
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error}`);
    }
  }

  /**
   * List events for a specific date
   */
  async getEventsForDate(date: string): Promise<CalendarEvent[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    await this.ensurePermission();

    try {
      // Extract date part from ISO string (YYYY-MM-DD format)
      const dateOnly = date.split('T')[0];
      const events = await NativeCalendar.listEvents(dateOnly);
      
      console.log(`📅 Found ${events.length} events for ${dateOnly}`);
      return events;
    } catch (error) {
      console.error('❌ Failed to get calendar events:', error);
      throw new Error(`Failed to get calendar events: ${error}`);
    }
  }

  /**
   * Get events for today
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getEventsForDate(today);
  }

  /**
   * Get events for a date range
   */
  async getEventsForDateRange(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    await this.ensurePermission();

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allEvents: CalendarEvent[] = [];

      // Get events for each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateString = currentDate.toISOString().split('T')[0];
        const dayEvents = await this.getEventsForDate(dateString);
        allEvents.push(...dayEvents);
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`📅 Found ${allEvents.length} events between ${startDate} and ${endDate}`);
      return allEvents;
    } catch (error) {
      console.error('❌ Failed to get events for date range:', error);
      throw new Error(`Failed to get events for date range: ${error}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    title: string,
    startDate: string,
    location?: string
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event updates not available on web');
    }

    await this.ensurePermission();

    try {
      const success = await NativeCalendar.updateEvent(eventId, title, startDate, location);
      
      if (success) {
        console.log('✅ Calendar event updated:', eventId);
      } else {
        console.log('❌ Failed to update calendar event:', eventId);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to update calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error}`);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event deletion not available on web');
    }

    await this.ensurePermission();

    try {
      const success = await NativeCalendar.deleteEvent(eventId);
      
      if (success) {
        console.log('✅ Calendar event deleted:', eventId);
      } else {
        console.log('❌ Failed to delete calendar event:', eventId);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Failed to delete calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error}`);
    }
  }

  /**
   * Get this week's events
   */
  async getThisWeeksEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);

    return await this.getEventsForDateRange(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
  }

  /**
   * Get next week's events
   */
  async getNextWeeksEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfNextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    const endOfNextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 13);

    return await this.getEventsForDateRange(
      startOfNextWeek.toISOString().split('T')[0],
      endOfNextWeek.toISOString().split('T')[0]
    );
  }

  /**
   * Check if calendar functionality is available
   */
  isAvailable(): boolean {
    return Platform.OS !== 'web' && NativeCalendar !== null && this.permissionStatus !== 'unavailable';
  }

  /**
   * Get formatted permission status for display
   */
  getPermissionStatusForDisplay(): string {
    switch (this.permissionStatus) {
      case 'authorized':
        return 'Full Access';
      case 'fullAccess':
        return 'Full Access';
      case 'writeOnly':
        return 'Write Only';
      case 'denied':
        return 'Access Denied';
      case 'restricted':
        return 'Restricted';
      case 'notDetermined':
        return 'Not Requested';
      default:
        return 'Unknown';
    }
  }
}