import { NextRequest } from "next/server";

export function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

export function auth(req: NextRequest) {
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  // todo 权限校验
  return {
    error: false,
  };
}
