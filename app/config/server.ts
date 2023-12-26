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

export const getServerSideConfig = () => {
  return {};
};
