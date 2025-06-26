/**
 * Native Calendar Module JavaScript Interface
 * 
 * This exposes the native iOS CalendarModule as a TypeScript module with
 * comprehensive calendar functionality using iOS EventKit framework.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

const { CalendarModule } = NativeModules;

// Create event emitter for calendar events only if module is available
let calendarEventEmitter: NativeEventEmitter | null = null;
if (CalendarModule) {
  calendarEventEmitter = new NativeEventEmitter(CalendarModule);
}

// TypeScript interfaces for type safety
export interface CalendarEvent {
  id: string;
  title: string;
  location?: string;
  startDate: number; // timestamp in milliseconds
  endDate: number;   // timestamp in milliseconds
  notes?: string;
  isAllDay?: boolean;
  calendarId: string;
  calendarTitle: string;
  status: number;
  availability: number;
}

export interface Calendar {
  id: string;
  title: string;
  source: string;
  type: number;
  allowsContentModifications: boolean;
  color: string;
}

export interface CalendarPermissionStatus {
  status: 'notDetermined' | 'restricted' | 'denied' | 'authorized' | 'unknown';
  authorized: boolean;
}

export interface CreateEventParams {
  title: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  calendarId?: string;
}

export interface UpdateEventParams {
  eventId: string;
  title?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export interface GetEventsParams {
  startDate?: Date;
  endDate?: Date;
  calendarIds?: string[];
}

// Calendar event types for event emitter
export type CalendarEventType = 
  | 'CalendarEventReminder'
  | 'CalendarAccessGranted'
  | 'CalendarAccessDenied';

/**
 * Native Calendar Module Interface
 */
class IOSCalendarModule {
  
  // Constants from native module
  static get constants() {
    return CalendarModule.getConstants();
  }

  /**
   * Request calendar permission from user
   */
  static async requestCalendarPermission(): Promise<boolean> {
    try {
      return await CalendarModule.requestCalendarPermission();
    } catch (error) {
      console.error('❌ Failed to request calendar permission:', error);
      throw error;
    }
  }

  /**
   * Get current calendar permission status
   */
  static async getCalendarPermissionStatus(): Promise<CalendarPermissionStatus> {
    try {
      return await CalendarModule.getCalendarPermissionStatus();
    } catch (error) {
      console.error('❌ Failed to get calendar permission status:', error);
      throw error;
    }
  }

  /**
   * Get all available calendars
   */
  static async getCalendars(): Promise<Calendar[]> {
    try {
      return await CalendarModule.getCalendars();
    } catch (error) {
      console.error('❌ Failed to get calendars:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar event
   */
  static async createCalendarEvent(params: CreateEventParams): Promise<CalendarEvent> {
    try {
      const {
        title,
        location,
        startDate,
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000), // Default 1 hour
        notes,
        calendarId
      } = params;

      return await CalendarModule.createCalendarEvent(
        title,
        location || '',
        startDate,
        endDate,
        notes || '',
        calendarId || null
      );
    } catch (error) {
      console.error('❌ Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  static async updateCalendarEvent(params: UpdateEventParams): Promise<{ success: boolean; eventId: string }> {
    try {
      const { eventId, title, location, startDate, endDate, notes } = params;

      return await CalendarModule.updateCalendarEvent(
        eventId,
        title || null,
        location || null,
        startDate || null,
        endDate || null,
        notes || null
      );
    } catch (error) {
      console.error('❌ Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteCalendarEvent(eventId: string): Promise<{ success: boolean; eventId: string }> {
    try {
      return await CalendarModule.deleteCalendarEvent(eventId);
    } catch (error) {
      console.error('❌ Failed to delete calendar event:', error);
      throw error;
    }
  }

  /**
   * Get calendar events within a date range
   */
  static async getEvents(params: GetEventsParams = {}): Promise<CalendarEvent[]> {
    try {
      const {
        startDate = new Date(),
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        calendarIds = []
      } = params;

      return await CalendarModule.getEvents(startDate, endDate, calendarIds);
    } catch (error) {
      console.error('❌ Failed to get calendar events:', error);
      throw error;
    }
  }

  /**
   * Add event listener for calendar events
   */
  static addEventListener(
    eventType: CalendarEventType,
    listener: (event: any) => void
  ): { remove: () => void } {
    if (!calendarEventEmitter) {
      console.warn('Calendar event emitter not available');
      return { remove: () => {} };
    }
    const subscription = calendarEventEmitter.addListener(eventType, listener);
    return {
      remove: () => subscription.remove()
    };
  }

  /**
   * Remove all event listeners
   */
  static removeAllListeners(eventType?: CalendarEventType): void {
    if (!calendarEventEmitter) {
      console.warn('Calendar event emitter not available');
      return;
    }
    if (eventType) {
      calendarEventEmitter.removeAllListeners(eventType);
    } else {
      // Remove all listeners for all event types
      const eventTypes: CalendarEventType[] = ['CalendarEventReminder', 'CalendarAccessGranted', 'CalendarAccessDenied'];
      eventTypes.forEach(type => calendarEventEmitter.removeAllListeners(type));
    }
  }

  /**
   * Utility: Create a quick event with minimal parameters
   */
  static async createQuickEvent(
    title: string,
    startDate: Date,
    durationMinutes: number = 60
  ): Promise<CalendarEvent> {
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    return this.createCalendarEvent({
      title,
      startDate,
      endDate
    });
  }

  /**
   * Utility: Get today's events
   */
  static async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.getEvents({
      startDate: startOfDay,
      endDate: endOfDay
    });
  }

  /**
   * Utility: Get upcoming events (next 7 days)
   */
  static async getUpcomingEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.getEvents({
      startDate: now,
      endDate: nextWeek
    });
  }

  /**
   * Utility: Check if calendar access is available
   */
  static async isCalendarAccessible(): Promise<boolean> {
    try {
      const status = await this.getCalendarPermissionStatus();
      return status.authorized;
    } catch (error) {
      return false;
    }
  }

  /**
   * Utility: Format event for display
   */
  static formatEventForDisplay(event: CalendarEvent): string {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    if (event.isAllDay) {
      return `${event.title} (All Day)`;
    } else {
      const startTime = startDate.toLocaleTimeString([], timeFormat);
      const endTime = endDate.toLocaleTimeString([], timeFormat);
      return `${event.title} (${startTime} - ${endTime})`;
    }
  }
}

export default IOSCalendarModule;

// Export the raw native module for advanced use cases
export { CalendarModule as RawCalendarModule };