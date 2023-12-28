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

declare global {
  namespace NodeJS {
    interface ProcessEnv {
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
}
export interface JsTicket {
  ticket: string;
  access_token: string;
  create_time: number;
  expire_time: number;
}
