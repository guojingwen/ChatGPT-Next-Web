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
}

declare interface Wx {
  [key: string]: any;
}
