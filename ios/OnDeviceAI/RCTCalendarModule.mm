#import "RCTCalendarModule.h"
#import <React/RCTLog.h>
#import <EventKit/EventKit.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "OnDeviceAISpec.h"
#endif

@interface RCTCalendarModule ()
@property (nonatomic, strong) EKEventStore *eventStore;
@end

@implementation RCTCalendarModule

RCT_EXPORT_MODULE(CalendarModule)

- (instancetype)init {
    self = [super init];
    if (self) {
        _eventStore = [[EKEventStore alloc] init];
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (@available(iOS 17.0, *)) {
        [self.eventStore requestFullAccessToEventsWithCompletion:^(BOOL granted, NSError *error) {
            if (error) {
                reject(@"permission_error", error.localizedDescription, error);
            } else {
                resolve(@(granted));
            }
        }];
    } else {
        [self.eventStore requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
            if (error) {
                reject(@"permission_error", error.localizedDescription, error);
            } else {
                resolve(@(granted));
            }
        }];
    }
}

RCT_EXPORT_METHOD(createEvent:(NSString *)title 
                  isoDate:(NSString *)isoDate 
                  location:(NSString *)location
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    // Check permission
    EKAuthorizationStatus status;
    if (@available(iOS 17.0, *)) {
        status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    } else {
        status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    }
    
    if (status != EKAuthorizationStatusAuthorized) {
        reject(@"permission_denied", @"Calendar permission not granted", nil);
        return;
    }
    
    // Parse ISO date
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss"];
    [formatter setTimeZone:[NSTimeZone timeZoneWithAbbreviation:@"UTC"]];
    NSDate *eventDate = [formatter dateFromString:isoDate];
    
    if (!eventDate) {
        reject(@"invalid_date", @"Invalid ISO date format", nil);
        return;
    }
    
    // Create event
    EKEvent *event = [EKEvent eventWithEventStore:self.eventStore];
    event.title = title;
    event.startDate = eventDate;
    event.endDate = [eventDate dateByAddingTimeInterval:3600]; // 1 hour duration
    event.location = location;
    event.calendar = [self.eventStore defaultCalendarForNewEvents];
    
    NSError *error;
    BOOL success = [self.eventStore saveEvent:event span:EKSpanThisEvent error:&error];
    
    if (success) {
        resolve(event.eventIdentifier);
    } else {
        reject(@"save_error", error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(listEvents:(NSString *)isoDate 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    // Parse date
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd"];
    NSDate *date = [formatter dateFromString:isoDate];
    
    if (!date) {
        reject(@"invalid_date", @"Invalid date format", nil);
        return;
    }
    
    // Create date range for the day
    NSCalendar *calendar = [NSCalendar currentCalendar];
    NSDate *startDate = [calendar startOfDayForDate:date];
    NSDate *endDate = [calendar dateByAddingUnit:NSCalendarUnitDay value:1 toDate:startDate options:0];
    
    // Create predicate
    NSPredicate *predicate = [self.eventStore predicateForEventsWithStartDate:startDate endDate:endDate calendars:nil];
    NSArray<EKEvent *> *events = [self.eventStore eventsMatchingPredicate:predicate];
    
    // Convert to dictionary array
    NSMutableArray *eventArray = [[NSMutableArray alloc] init];
    NSDateFormatter *resultFormatter = [[NSDateFormatter alloc] init];
    [resultFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss"];
    
    for (EKEvent *event in events) {
        [eventArray addObject:@{
            @"id": event.eventIdentifier ?: @"",
            @"title": event.title ?: @"",
            @"start": [resultFormatter stringFromDate:event.startDate]
        }];
    }
    
    resolve(eventArray);
}

RCT_EXPORT_METHOD(updateEvent:(NSString *)eventId 
                  title:(NSString *)title 
                  isoDate:(NSString *)isoDate 
                  location:(NSString *)location
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    EKEvent *event = [self.eventStore eventWithIdentifier:eventId];
    if (!event) {
        reject(@"event_not_found", @"Event not found", nil);
        return;
    }
    
    // Parse new date
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss"];
    NSDate *newDate = [formatter dateFromString:isoDate];
    
    if (!newDate) {
        reject(@"invalid_date", @"Invalid ISO date format", nil);
        return;
    }
    
    // Update event properties
    event.title = title;
    event.startDate = newDate;
    event.endDate = [newDate dateByAddingTimeInterval:3600]; // 1 hour duration
    event.location = location;
    
    NSError *error;
    BOOL success = [self.eventStore saveEvent:event span:EKSpanThisEvent error:&error];
    
    if (success) {
        resolve(@YES);
    } else {
        reject(@"update_error", error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(deleteEvent:(NSString *)eventId 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    EKEvent *event = [self.eventStore eventWithIdentifier:eventId];
    if (!event) {
        reject(@"event_not_found", @"Event not found", nil);
        return;
    }
    
    NSError *error;
    BOOL success = [self.eventStore removeEvent:event span:EKSpanThisEvent error:&error];
    
    if (success) {
        resolve(@YES);
    } else {
        reject(@"delete_error", error.localizedDescription, error);
    }
}

RCT_EXPORT_METHOD(getPermissionStatus:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    EKAuthorizationStatus status = [EKEventStore authorizationStatusForEntityType:EKEntityTypeEvent];
    NSString *statusString;
    
    switch (status) {
        case EKAuthorizationStatusAuthorized:
            statusString = @"authorized";
            break;
        case EKAuthorizationStatusDenied:
            statusString = @"denied";
            break;
        case EKAuthorizationStatusRestricted:
            statusString = @"restricted";
            break;
        case EKAuthorizationStatusNotDetermined:
            statusString = @"notDetermined";
            break;
        default:
            statusString = @"unknown";
            break;
    }
    
    resolve(statusString);
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeCalendarModuleSpecJSI>(params);
}
#endif

@end