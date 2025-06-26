require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name          = "OnDeviceAISpeech"
  s.version       = package["version"]
  s.summary       = package["description"]
  s.description   = package["description"]
  s.homepage      = package["homepage"]
  s.license       = package["license"]
  s.author        = package["author"]
  s.platforms     = { :ios => "15.1" }
  s.source        = { :git => "", :tag => "#{s.version}" }

  s.source_files = "ios/OnDeviceAI/**/*.{h,mm,swift}", "build/generated/ios/OnDeviceAISpec/*.{h,mm}"
  s.header_dir    = "OnDeviceAISpeech"

  s.dependency "React-Core"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-RCTText"
  
  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    s.compiler_flags = "-DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig    = {
        "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
        "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
        "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
    s.dependency "React-Codegen"
    s.dependency "RCT-Folly"
    s.dependency "RCTRequired"
    s.dependency "RCTTypeSafety"
    s.dependency "ReactCommon/turbomodule/core"
  end
end