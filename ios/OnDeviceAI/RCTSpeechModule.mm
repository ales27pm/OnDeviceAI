#import "RCTSpeechModule.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <AVFoundation/AVFoundation.h>
#import <Speech/Speech.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "OnDeviceAISpec.h"
#endif

@interface RCTSpeechModule () <SFSpeechRecognizerDelegate, AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) SFSpeechRecognizer *speechRecognizer;
@property (nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *recognitionRequest;
@property (nonatomic, strong) SFSpeechRecognitionTask *recognitionTask;
@property (nonatomic, strong) AVAudioEngine *audioEngine;
@property (nonatomic, strong) AVSpeechSynthesizer *speechSynthesizer;
@property (nonatomic, strong) NSMutableDictionary *utteranceCallbacks;
@property (nonatomic, assign) BOOL isListening;

@end

@implementation RCTSpeechModule

RCT_EXPORT_MODULE(SpeechModule)

- (instancetype)init {
    self = [super init];
    if (self) {
        _audioEngine = [[AVAudioEngine alloc] init];
        _speechSynthesizer = [[AVSpeechSynthesizer alloc] init];
        _speechSynthesizer.delegate = self;
        _utteranceCallbacks = [[NSMutableDictionary alloc] init];
        _isListening = NO;
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onSpeechStart", @"onSpeechResult", @"onSpeechError", @"onSpeechEnd", 
             @"onSpeechProgress", @"onSpeechFinish", @"onSpeechPause", @"onSpeechResume", 
             @"onVolumeChanged", @"onRecognitionStatusChanged"];
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

#pragma mark - Speech Recognition Methods

RCT_EXPORT_METHOD(requestSpeechRecognitionAuthorization:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
        dispatch_async(dispatch_get_main_queue(), ^{
            switch (status) {
                case SFSpeechRecognizerAuthorizationStatusAuthorized:
                    resolve(@YES);
                    break;
                case SFSpeechRecognizerAuthorizationStatusDenied:
                case SFSpeechRecognizerAuthorizationStatusRestricted:
                case SFSpeechRecognizerAuthorizationStatusNotDetermined:
                    resolve(@NO);
                    break;
            }
        });
    }];
}

RCT_EXPORT_METHOD(startRecognition:(NSString *)locale 
                  requiresOnDeviceRecognition:(BOOL)requiresOnDevice
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    if (self.isListening) {
        reject(@"already_listening", @"Speech recognition is already in progress", nil);
        return;
    }
    
    // Configure speech recognizer
    NSLocale *speechLocale = [NSLocale localeWithLocaleIdentifier:locale];
    self.speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:speechLocale];
    
    if (!self.speechRecognizer) {
        reject(@"recognizer_unavailable", @"Speech recognizer is not available for this locale", nil);
        return;
    }
    
    self.speechRecognizer.delegate = self;
    
    if (requiresOnDevice && !self.speechRecognizer.supportsOnDeviceRecognition) {
        reject(@"on_device_unavailable", @"On-device recognition is not available", nil);
        return;
    }
    
    // Configure audio session
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error;
    [audioSession setCategory:AVAudioSessionCategoryRecord 
                  withOptions:AVAudioSessionCategoryOptionDuckOthers 
                        error:&error];
    if (error) {
        reject(@"audio_session_error", error.localizedDescription, error);
        return;
    }
    
    [audioSession setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&error];
    if (error) {
        reject(@"audio_session_error", error.localizedDescription, error);
        return;
    }
    
    // Create recognition request
    self.recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
    self.recognitionRequest.shouldReportPartialResults = YES;
    self.recognitionRequest.requiresOnDeviceRecognition = requiresOnDevice;
    
    // Configure audio engine
    AVAudioInputNode *inputNode = self.audioEngine.inputNode;
    AVAudioFormat *recordingFormat = [inputNode outputFormatForBus:0];
    
    [inputNode installTapOnBus:0 
                    bufferSize:1024 
                        format:recordingFormat 
                         block:^(AVAudioPCMBuffer *buffer, AVAudioTime *when) {
        [self.recognitionRequest appendAudioPCMBuffer:buffer];
    }];
    
    [self.audioEngine prepare];
    [self.audioEngine startAndReturnError:&error];
    if (error) {
        reject(@"audio_engine_error", error.localizedDescription, error);
        return;
    }
    
    // Start recognition task
    __weak typeof(self) weakSelf = self;
    self.recognitionTask = [self.speechRecognizer recognitionTaskWithRequest:self.recognitionRequest 
                                                                resultHandler:^(SFSpeechRecognitionResult *result, NSError *error) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) return;
        
        if (error) {
            [strongSelf sendEventWithName:@"onSpeechError" body:@{@"error": error.localizedDescription}];
            [strongSelf stopRecognition:nil rejecter:nil];
            return;
        }
        
        if (result) {
            [strongSelf sendEventWithName:@"onSpeechResult" body:@{
                @"transcript": result.bestTranscription.formattedString,
                @"isFinal": @(result.isFinal)
            }];
            
            if (result.isFinal) {
                [strongSelf sendEventWithName:@"onSpeechEnd" body:@{@"transcript": result.bestTranscription.formattedString}];
            }
        }
    }];
    
    self.isListening = YES;
    [self sendEventWithName:@"onSpeechStart" body:@{}];
    resolve(nil);
}

RCT_EXPORT_METHOD(stopRecognition:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.isListening) {
        if (resolve) resolve(nil);
        return;
    }
    
    [self.audioEngine stop];
    [self.audioEngine.inputNode removeTapOnBus:0];
    [self.recognitionRequest endAudio];
    [self.recognitionTask cancel];
    
    self.recognitionTask = nil;
    self.recognitionRequest = nil;
    self.isListening = NO;
    
    // Deactivate audio session
    [[AVAudioSession sharedInstance] setActive:NO withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:nil];
    
    if (resolve) resolve(nil);
}

RCT_EXPORT_METHOD(destroyRecognizer:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self stopRecognition:nil rejecter:nil];
    self.speechRecognizer = nil;
    if (resolve) resolve(nil);
}

RCT_EXPORT_METHOD(isRecognitionAvailable:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@([SFSpeechRecognizer authorizationStatus] == SFSpeechRecognizerAuthorizationStatusAuthorized));
}

RCT_EXPORT_METHOD(getSupportedLocales:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSSet<NSLocale *> *supportedLocales = [SFSpeechRecognizer supportedLocales];
    NSMutableArray *localeStrings = [[NSMutableArray alloc] init];
    
    for (NSLocale *locale in supportedLocales) {
        [localeStrings addObject:locale.localeIdentifier];
    }
    
    resolve(localeStrings);
}

#pragma mark - Text-to-Speech Methods

RCT_EXPORT_METHOD(getAvailableVoices:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSArray<AVSpeechSynthesisVoice *> *voices = [AVSpeechSynthesisVoice speechVoices];
    NSMutableArray *voiceData = [[NSMutableArray alloc] init];
    
    for (AVSpeechSynthesisVoice *voice in voices) {
        [voiceData addObject:@{
            @"id": voice.identifier,
            @"name": voice.name,
            @"language": voice.language,
            @"quality": @(voice.quality),
            @"gender": @(voice.gender)
        }];
    }
    
    resolve(voiceData);
}

RCT_EXPORT_METHOD(speak:(NSString *)text 
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
    
    // Configure voice
    NSString *voiceId = options[@"voiceId"];
    if (voiceId) {
        AVSpeechSynthesisVoice *voice = [AVSpeechSynthesisVoice voiceWithIdentifier:voiceId];
        if (voice) {
            utterance.voice = voice;
        }
    }
    
    // Configure speech parameters
    if (options[@"rate"]) {
        utterance.rate = [options[@"rate"] floatValue];
    }
    if (options[@"pitch"]) {
        utterance.pitchMultiplier = [options[@"pitch"] floatValue];
    }
    if (options[@"volume"]) {
        utterance.volume = [options[@"volume"] floatValue];
    }
    
    // Store callback for this utterance
    NSString *utteranceId = [[NSUUID UUID] UUIDString];
    self.utteranceCallbacks[utteranceId] = @{@"resolve": resolve, @"reject": reject};
    
    // Store utterance ID for tracking
    utterance.rate = utterance.rate; // Dummy operation to ensure utterance is configured
    objc_setAssociatedObject(utterance, @"utteranceId", utteranceId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    
    [self.speechSynthesizer speakUtterance:utterance];
    
    // Return utterance ID immediately
    resolve(utteranceId);
}

RCT_EXPORT_METHOD(stopSpeaking:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.speechSynthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
    resolve(nil);
}

RCT_EXPORT_METHOD(pauseSpeaking:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.speechSynthesizer pauseSpeakingAtBoundary:AVSpeechBoundaryImmediate];
    resolve(nil);
}

RCT_EXPORT_METHOD(resumeSpeaking:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self.speechSynthesizer continueSpeaking];
    resolve(nil);
}

RCT_EXPORT_METHOD(isSpeaking:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@(self.speechSynthesizer.speaking));
}

RCT_EXPORT_METHOD(isPaused:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@(self.speechSynthesizer.paused));
}

RCT_EXPORT_METHOD(setDefaultVoice:(NSString *)voiceId 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    AVSpeechSynthesisVoice *voice = [AVSpeechSynthesisVoice voiceWithIdentifier:voiceId];
    resolve(@(voice != nil));
}

RCT_EXPORT_METHOD(configureAudioSession:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error;
    [audioSession setCategory:AVAudioSessionCategoryPlayback error:&error];
    if (error) {
        reject(@"audio_session_error", error.localizedDescription, error);
        return;
    }
    [audioSession setActive:YES error:&error];
    if (error) {
        reject(@"audio_session_error", error.localizedDescription, error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(releaseAudioSession:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [[AVAudioSession sharedInstance] setActive:NO error:nil];
    resolve(nil);
}

RCT_EXPORT_METHOD(getVersion:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@"1.0.0");
}

RCT_EXPORT_METHOD(isInitialized:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@YES);
}

#pragma mark - AVSpeechSynthesizerDelegate

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didStartSpeechUtterance:(AVSpeechUtterance *)utterance {
    [self sendEventWithName:@"onSpeechProgress" body:@{@"event": @"start"}];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didFinishSpeechUtterance:(AVSpeechUtterance *)utterance {
    [self sendEventWithName:@"onSpeechFinish" body:@{@"event": @"finish"}];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didPauseSpeechUtterance:(AVSpeechUtterance *)utterance {
    [self sendEventWithName:@"onSpeechPause" body:@{@"event": @"pause"}];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didContinueSpeechUtterance:(AVSpeechUtterance *)utterance {
    [self sendEventWithName:@"onSpeechResume" body:@{@"event": @"resume"}];
}

#pragma mark - SFSpeechRecognizerDelegate

- (void)speechRecognizer:(SFSpeechRecognizer *)speechRecognizer availabilityDidChange:(BOOL)available {
    [self sendEventWithName:@"onRecognitionStatusChanged" body:@{@"available": @(available)}];
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeSpeechModuleSpecJSI>(params);
}
#endif

@end