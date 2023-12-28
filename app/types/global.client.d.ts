"use client";
interface Window {
  wx: Wx;
  wxPromise: Promise<Wx>;
  devices: DeviceInfo;
  isVoiceGrantPrivilege: boolean;
}

declare interface Wx {
  [key: string]: any;
}

type DeviceInfo = {
  isAndroid: boolean;
  isIos: boolean;
  isMobile: boolean;
  isSafari: boolean;
  isMacOS: boolean;
  isWeixin: boolean;
};
