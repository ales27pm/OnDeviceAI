import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/**
 * Calendar event interface
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
  location?: string;
  allDay?: boolean;
}

/**
 * Calendar module for agent tool dispatch
 */
export class CalendarModule {
  private static instance: CalendarModule | null = null;
  private defaultCalendarId: string | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance
   */
  static getInstance(): CalendarModule {
    if (!this.instance) {
      this.instance = new CalendarModule();
    }
    return this.instance;
  }

  /**
   * Initialize calendar module and get default calendar
   */
  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar functionality is not available on web platform');
    }

    try {
      // Request permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Calendar permission not granted');
      }

      // Get default calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.source.name === 'Default') || calendars[0];
      
      if (!defaultCalendar) {
        throw new Error('No calendar found');
      }

      this.defaultCalendarId = defaultCalendar.id;
      console.log('Calendar module initialized with calendar:', defaultCalendar.title);

    } catch (error) {
      console.error('Failed to initialize calendar module:', error);
      throw error;
    }
  }

  /**
   * Get calendar events for a date range
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (Platform.OS === 'web') {
      return []; // Return empty array for web
    }

    try {
      await this.ensureInitialized();

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Use ISO format (YYYY-MM-DD)');
      }

      const events = await Calendar.getEventsAsync(
        [this.defaultCalendarId!],
        start,
        end
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        notes: event.notes || undefined,
        location: event.location || undefined,
        allDay: event.allDay
      }));

    } catch (error) {
      console.error('Failed to get calendar events:', error);
      throw new Error(`Failed to retrieve calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(
    title: string,
    startDate: string,
    endDate: string,
    notes?: string,
    location?: string
  ): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event creation is not available on web platform');
    }

    try {
      await this.ensureInitialized();

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss)');
      }

      if (start >= end) {
        throw new Error('Start date must be before end date');
      }

      const eventId = await Calendar.createEventAsync(this.defaultCalendarId!, {
        title,
        startDate: start,
        endDate: end,
        notes: notes || '',
        location: location || '',
        timeZone: 'GMT', // Use local timezone
      });

      console.log('Created calendar event:', eventId);
      return eventId;

    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(
    eventId: string,
    updates: {
      title?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
      location?: string;
    }
  ): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event updates are not available on web platform');
    }

    try {
      await this.ensureInitialized();

      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.location !== undefined) updateData.location = updates.location;
      
      if (updates.startDate) {
        const start = new Date(updates.startDate);
        if (isNaN(start.getTime())) {
          throw new Error('Invalid start date format');
        }
        updateData.startDate = start;
      }
      
      if (updates.endDate) {
        const end = new Date(updates.endDate);
        if (isNaN(end.getTime())) {
          throw new Error('Invalid end date format');
        }
        updateData.endDate = end;
      }

      await Calendar.updateEventAsync(eventId, updateData);
      console.log('Updated calendar event:', eventId);

    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw new Error(`Failed to update calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('Calendar event deletion is not available on web platform');
    }

    try {
      await this.ensureInitialized();
      await Calendar.deleteEventAsync(eventId);
      console.log('Deleted calendar event:', eventId);

    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw new Error(`Failed to delete calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get today's events
   */
  async getTodaysEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await this.getCalendarEvents(
      startOfDay.toISOString().split('T')[0],
      endOfDay.toISOString().split('T')[0]
    );
  }

  /**
   * Get this week's events
   */
  async getThisWeeksEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);

    return await this.getCalendarEvents(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    );
  }

  /**
   * Ensure the module is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.defaultCalendarId) {
      await this.initialize();
    }
  }

  /**
   * Check if calendar functionality is available
   */
  isAvailable(): boolean {
    return Platform.OS !== 'web';
  }
}