//
//  SpeechManager.swift
//  OnDeviceAISpeech
//

import Foundation
import Speech
import AVFoundation

@objc(SpeechManager)
class SpeechManager: NSObject, SFSpeechRecognizerDelegate, AVSpeechSynthesizerDelegate {
  private let audioEngine = AVAudioEngine()
  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private let synthesizer = AVSpeechSynthesizer()
  private weak var parentModule: RCTSpeechModule?
  private var currentUtteranceId: String?
  
  @objc
  init(withParentModule module: RCTSpeechModule) {
    self.parentModule = module
    super.init()
    synthesizer.delegate = self
  }
  
  // MARK: – STT
  
  @objc
  func requestSpeechRecognitionAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                                             reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { status in
      DispatchQueue.main.async {
        resolve(status == .authorized)
      }
    }
  }
  
  @objc
  func startRecognition(_ locale: String,
                        requiresOnDeviceRecognition: Bool,
                        resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
    // Cancel existing
    recognitionTask?.cancel()
    recognitionTask = nil
    
    // Audio session
    let session = AVAudioSession.sharedInstance()
    do {
      try session.setCategory(.record, mode: .measurement, options: .duckOthers)
      try session.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("audioSessionError", "Failed to setup audio session", error)
      return
    }
    
    // Recognizer
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale)) else {
      reject("recognizerError", "Locale not supported: \(locale)", nil)
      return
    }
    speechRecognizer = recognizer
    speechRecognizer?.delegate = self
    
    // On-device check
    if requiresOnDeviceRecognition, #available(iOS 13, *),
       !(recognizer.supportsOnDeviceRecognition ?? false) {
      reject("onDeviceError", "On-device not supported for \(locale)", nil)
      return
    }
    
    // Request & Task
    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    if #available(iOS 13, *) { request.requiresOnDeviceRecognition = requiresOnDeviceRecognition }
    recognitionRequest = request
    
    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      var isFinal = false
      if let r = result {
        let text = r.bestTranscription.formattedString
        isFinal = r.isFinal
        self?.parentModule?.sendEvent(withName: "onSpeechResult",
                                      body: ["result": text, "isFinal": isFinal])
      }
      if error != nil || isFinal {
        self?.stopAudio()
        if let err = error {
          self?.parentModule?.sendEvent(withName: "onSpeechError",
                                        body: ["error": err.localizedDescription])
        }
        self?.parentModule?.sendEvent(withName: "onSpeechEnd", body: nil)
      }
    }
    
    // Audio tap
    let input = audioEngine.inputNode
    let format = input.outputFormat(forBus: 0)
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
      request.append(buffer)
    }
    audioEngine.prepare()
    do {
      try audioEngine.start()
      parentModule?.sendEvent(withName: "onSpeechStart", body: nil)
      resolve(nil)
    } catch {
      reject("audioEngineError", "Could not start audio engine", error)
    }
  }
  
  @objc
  func stopRecognition(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    recognitionRequest?.endAudio()
    resolve(nil)
  }
  
  @objc
  func destroyRecognizer(_ resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    stopAudio()
    resolve(nil)
  }
  
  private func stopAudio() {
    if audioEngine.isRunning {
      audioEngine.stop()
      audioEngine.inputNode.removeTap(onBus: 0)
    }
    recognitionRequest?.endAudio()
    recognitionRequest = nil
    recognitionTask?.cancel()
    recognitionTask = nil
  }
  
  // MARK: – TTS
  
  @objc
  func getAvailableVoices(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    let list = AVSpeechSynthesisVoice.speechVoices().map {
      ["id": $0.identifier, "name": $0.name, "language": $0.language]
    }
    resolve(list)
  }
  
  @objc
  func speak(_ text: String,
             options: NSDictionary,
             resolve: @escaping RCTPromiseResolveBlock,
             reject: @escaping RCTPromiseRejectBlock) {
    let utterance = AVSpeechUtterance(string: text)
    if let vid = options["voiceId"] as? String {
      utterance.voice = AVSpeechSynthesisVoice(identifier: vid)
    }
    if let rate = options["rate"] as? Float {
      utterance.rate = rate
    }
    if let pitch = options["pitch"] as? Float {
      utterance.pitchMultiplier = pitch
    }
    currentUtteranceId = UUID().uuidString
    synthesizer.speak(utterance)
    resolve(currentUtteranceId)
  }
  
  @objc
  func stopSpeaking(_ resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    synthesizer.stopSpeaking(at: .immediate)
    resolve(nil)
  }
  
  @objc
  func pauseSpeaking(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    synthesizer.pauseSpeaking(at: .word)
    resolve(nil)
  }
  
  @objc
  func resumeSpeaking(_ resolve: @escaping RCTPromiseResolveBlock,
                      reject: @escaping RCTPromiseRejectBlock) {
    synthesizer.continueSpeaking()
    resolve(nil)
  }
  
  // MARK: – AVSpeechSynthesizerDelegate
  
  func speechSynthesizer(_ s: AVSpeechSynthesizer,
                         willSpeakRangeOfSpeechString range: NSRange,
                         utterance: AVSpeechUtterance) {
    parentModule?.sendEvent(withName: "onSpeechProgress",
                            body: ["utteranceId": currentUtteranceId ?? "",
                                   "charIndex": range.location,
                                   "charLength": range.length])
  }
  
  func speechSynthesizer(_ s: AVSpeechSynthesizer,
                         didStart utterance: AVSpeechUtterance) {
    parentModule?.sendEvent(withName: "onSpeechStart",
                            body: ["utteranceId": currentUtteranceId ?? ""])
  }
  
  func speechSynthesizer(_ s: AVSpeechSynthesizer,
                         didFinish utterance: AVSpeechUtterance) {
    parentModule?.sendEvent(withName: "onSpeechFinish",
                            body: ["utteranceId": currentUtteranceId ?? ""])
    currentUtteranceId = nil
  }
  
  func speechSynthesizer(_ s: AVSpeechSynthesizer,
                         didPause utterance: AVSpeechUtterance) {
    parentModule?.sendEvent(withName: "onSpeechPause",
                            body: ["utteranceId": currentUtteranceId ?? ""])
  }
  
  func speechSynthesizer(_ s: AVSpeechSynthesizer,
                         didContinue utterance: AVSpeechUtterance) {
    parentModule?.sendEvent(withName: "onSpeechResume",
                            body: ["utteranceId": currentUtteranceId ?? ""])
  }
}