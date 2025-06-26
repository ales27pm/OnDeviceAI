#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTTurboModule.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "OnDeviceAISpec.h"
#else
// Fallback for Old Architecture
#import <React/RCTBridgeModule.h>
#endif

@interface RCTSpeechModule : RCTEventEmitter <RCTBridgeModule>
#ifdef RCT_NEW_ARCH_ENABLED
<NativeSpeechModuleSpec>
#endif

@end