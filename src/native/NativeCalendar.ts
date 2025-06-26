import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Calendar event interface for native module
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
}

/**
 * Native Calendar TurboModule specification
 * Provides calendar access with EventKit integration on iOS
 * This interface will be used by React Native Codegen to generate native bindings
 */
export interface Spec extends TurboModule {
  /**
   * Request calendar permission from the user
   * @returns Promise<boolean> - true if permission granted, false otherwise
   */
  requestPermission(): Promise<boolean>;

  /**
   * Create a new calendar event
   * @param title - Event title
   * @param isoDate - Event date in ISO format (YYYY-MM-DDTHH:mm:ss)
   * @param location - Optional event location
   * @returns Promise<string> - Event identifier if successful
   */
  createEvent(title: string, isoDate: string, location?: string): Promise<string>;

  /**
   * List all events for a specific date
   * @param isoDate - Date in ISO format (YYYY-MM-DD)
   * @returns Promise<CalendarEvent[]> - Array of events for the specified date
   */
  listEvents(isoDate: string): Promise<CalendarEvent[]>;

  /**
   * Update an existing calendar event
   * @param eventId - Event identifier
   * @param title - New event title
   * @param isoDate - New event date in ISO format
   * @param location - New event location
   * @returns Promise<boolean> - true if update successful
   */
  updateEvent(eventId: string, title: string, isoDate: string, location?: string): Promise<boolean>;

  /**
   * Delete a calendar event
   * @param eventId - Event identifier to delete
   * @returns Promise<boolean> - true if deletion successful
   */
  deleteEvent(eventId: string): Promise<boolean>;

  /**
   * Check current calendar permission status
   * @returns Promise<string> - Permission status: 'authorized', 'denied', 'restricted', 'notDetermined'
   */
  getPermissionStatus(): Promise<string>;
}

// Export the Spec interface as default for React Native Codegen
export default TurboModuleRegistry.get<Spec>('CalendarModule');