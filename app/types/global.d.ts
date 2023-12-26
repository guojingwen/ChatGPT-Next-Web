import Ffmpeg from "fluent-ffmpeg";

declare module "*.jpg";
declare module "*.png";
declare module "*.woff2";
declare module "*.woff";
declare module "*.ttf";
declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*.svg";

declare module "fluent-ffmpeg/lib/fluent-ffmpeg" {
  export default Ffmpeg;
}

declare interface Window {
  wx: Wx;
  wxPromise: Promise<Wx>;
  devices: DeviceInfo;
  isVoiceGrantPrivilege: boolean;
}

declare interface Wx {
  [key: string]: any;
}

interface JsTicket {
  ticket: string;
  access_token: string;
  create_time: number;
  expire_time: number;
}

type DeviceInfo = {
  isAndroid: boolean;
  isIos: boolean;
  isMobile: boolean;
  isSafari: boolean;
  isMacOS: boolean;
  isWeixin: boolean;
};
