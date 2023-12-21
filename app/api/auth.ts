import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();

  return {
    apiKey: token,
  };
}

export function auth(req: NextRequest) {
  console.log("auth 这是服务端接口");

  const serverConfig = getServerSideConfig();
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());
  const serverApiKey = serverConfig.apiKey;

  if (serverApiKey) {
    console.log("[Auth] use system api key");
    req.headers.set("Authorization", `Bearer ${serverApiKey}`);
  } else {
    console.log("[Auth] admin did not provide an api key");
  }

  return {
    error: false,
  };
}
