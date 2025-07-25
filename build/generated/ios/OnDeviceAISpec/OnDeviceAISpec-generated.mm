/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateModuleObjCpp
 *
 * We create an umbrella header (and corresponding implementation) here since
 * Cxx compilation in BUCK has a limitation: source-code producing genrule()s
 * must have a single output. More files => more genrule()s => slower builds.
 */

#import "OnDeviceAISpec.h"


@implementation NativeCalendarSpecBase


- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  _eventEmitterCallback = std::move(eventEmitterCallbackWrapper->_eventEmitterCallback);
}
@end


namespace facebook::react {
  
    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_requestPermission(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "requestPermission", @selector(requestPermission:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_createEvent(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "createEvent", @selector(createEvent:isoDate:location:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_listEvents(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "listEvents", @selector(listEvents:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_updateEvent(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "updateEvent", @selector(updateEvent:title:isoDate:location:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_deleteEvent(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "deleteEvent", @selector(deleteEvent:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeCalendarSpecJSI_getPermissionStatus(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "getPermissionStatus", @selector(getPermissionStatus:reject:), args, count);
    }

  NativeCalendarSpecJSI::NativeCalendarSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {
      
        methodMap_["requestPermission"] = MethodMetadata {0, __hostFunction_NativeCalendarSpecJSI_requestPermission};
        
        
        methodMap_["createEvent"] = MethodMetadata {3, __hostFunction_NativeCalendarSpecJSI_createEvent};
        
        
        methodMap_["listEvents"] = MethodMetadata {1, __hostFunction_NativeCalendarSpecJSI_listEvents};
        
        
        methodMap_["updateEvent"] = MethodMetadata {4, __hostFunction_NativeCalendarSpecJSI_updateEvent};
        
        
        methodMap_["deleteEvent"] = MethodMetadata {1, __hostFunction_NativeCalendarSpecJSI_deleteEvent};
        
        
        methodMap_["getPermissionStatus"] = MethodMetadata {0, __hostFunction_NativeCalendarSpecJSI_getPermissionStatus};
        
  }
} // namespace facebook::react

@implementation NativeSpeechModuleSpecBase


- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  _eventEmitterCallback = std::move(eventEmitterCallbackWrapper->_eventEmitterCallback);
}
@end

@implementation RCTCxxConvert (NativeSpeechModule_SpeechOptions)
+ (RCTManagedPointer *)JS_NativeSpeechModule_SpeechOptions:(id)json
{
  return facebook::react::managedPointer<JS::NativeSpeechModule::SpeechOptions>(json);
}
@end
namespace facebook::react {
  
    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_addListener(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, VoidKind, "addListener", @selector(addListener:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_removeListeners(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, VoidKind, "removeListeners", @selector(removeListeners:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_requestSpeechRecognitionAuthorization(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "requestSpeechRecognitionAuthorization", @selector(requestSpeechRecognitionAuthorization:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_startRecognition(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "startRecognition", @selector(startRecognition:requiresOnDeviceRecognition:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_stopRecognition(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "stopRecognition", @selector(stopRecognition:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_destroyRecognizer(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "destroyRecognizer", @selector(destroyRecognizer:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_isRecognitionAvailable(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "isRecognitionAvailable", @selector(isRecognitionAvailable:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_getSupportedLocales(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "getSupportedLocales", @selector(getSupportedLocales:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_getAvailableVoices(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "getAvailableVoices", @selector(getAvailableVoices:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_speak(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "speak", @selector(speak:options:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_stopSpeaking(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "stopSpeaking", @selector(stopSpeaking:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_pauseSpeaking(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "pauseSpeaking", @selector(pauseSpeaking:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_resumeSpeaking(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "resumeSpeaking", @selector(resumeSpeaking:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_isSpeaking(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "isSpeaking", @selector(isSpeaking:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_isPaused(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "isPaused", @selector(isPaused:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_setDefaultVoice(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "setDefaultVoice", @selector(setDefaultVoice:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_configureAudioSession(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "configureAudioSession", @selector(configureAudioSession:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_releaseAudioSession(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "releaseAudioSession", @selector(releaseAudioSession:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_getVersion(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "getVersion", @selector(getVersion:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeSpeechModuleSpecJSI_isInitialized(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "isInitialized", @selector(isInitialized:reject:), args, count);
    }

  NativeSpeechModuleSpecJSI::NativeSpeechModuleSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {
      
        methodMap_["addListener"] = MethodMetadata {1, __hostFunction_NativeSpeechModuleSpecJSI_addListener};
        
        
        methodMap_["removeListeners"] = MethodMetadata {1, __hostFunction_NativeSpeechModuleSpecJSI_removeListeners};
        
        
        methodMap_["requestSpeechRecognitionAuthorization"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_requestSpeechRecognitionAuthorization};
        
        
        methodMap_["startRecognition"] = MethodMetadata {2, __hostFunction_NativeSpeechModuleSpecJSI_startRecognition};
        
        
        methodMap_["stopRecognition"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_stopRecognition};
        
        
        methodMap_["destroyRecognizer"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_destroyRecognizer};
        
        
        methodMap_["isRecognitionAvailable"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_isRecognitionAvailable};
        
        
        methodMap_["getSupportedLocales"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_getSupportedLocales};
        
        
        methodMap_["getAvailableVoices"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_getAvailableVoices};
        
        
        methodMap_["speak"] = MethodMetadata {2, __hostFunction_NativeSpeechModuleSpecJSI_speak};
        setMethodArgConversionSelector(@"speak", 1, @"JS_NativeSpeechModule_SpeechOptions:");
        
        methodMap_["stopSpeaking"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_stopSpeaking};
        
        
        methodMap_["pauseSpeaking"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_pauseSpeaking};
        
        
        methodMap_["resumeSpeaking"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_resumeSpeaking};
        
        
        methodMap_["isSpeaking"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_isSpeaking};
        
        
        methodMap_["isPaused"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_isPaused};
        
        
        methodMap_["setDefaultVoice"] = MethodMetadata {1, __hostFunction_NativeSpeechModuleSpecJSI_setDefaultVoice};
        
        
        methodMap_["configureAudioSession"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_configureAudioSession};
        
        
        methodMap_["releaseAudioSession"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_releaseAudioSession};
        
        
        methodMap_["getVersion"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_getVersion};
        
        
        methodMap_["isInitialized"] = MethodMetadata {0, __hostFunction_NativeSpeechModuleSpecJSI_isInitialized};
        
  }
} // namespace facebook::react
