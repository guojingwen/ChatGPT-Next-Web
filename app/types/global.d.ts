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

declare interface Window {
  wx: Wx;
  wxPromise: Promise<Wx>;
  devices: DeviceInfo;
}

declare interface Wx {
  [key: string]: any;
}

declare module NodeJS {
  export interface ProcessEnv {
    NODE_ENV: "development" | "testing" | "production";
    DB_HOST: string;
    DB_PORT: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    PORT: string;
    APPID: string;
    APPSECRET: string;
    WEIXIN_TOKEN: string;
    SESSION_KEY: string;
    API_KEY: string;
  }
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
