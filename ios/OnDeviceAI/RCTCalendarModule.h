#import <React/RCTBridgeModule.h>
#import <React/RCTTurboModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "OnDeviceAISpec.h"
#endif

@interface RCTCalendarModule : NSObject <RCTBridgeModule>
#ifdef RCT_NEW_ARCH_ENABLED
<NativeCalendarModuleSpec>
#endif

@end