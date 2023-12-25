import { PartialByKey } from "@/app/types/utils";
import { NextRequest, NextResponse } from "next/server";
import sha1 from "sha1";
import { setTicket } from "../wxService";

async function handle(req: NextRequest) {
  // const conf = await sign(url);
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url")!;
  await setTicket();
  const { APPID } = process.env;
  type Obj = PartialByKey<WxSign, "appId" | "signature">;
  const obj: Obj = {
    // appId, // 必填，公众号的唯一标识
    jsapi_ticket: (global as any).jsticket!.ticket,
    nonceStr: createNonceStr(), // 必填，生成签名的随机串
    timestamp: createTimeStamp(), // 必填，生成签名的时间戳
    url,
  };
  const keys = Object.keys(obj).sort();
  type Key = keyof typeof obj;
  const str = keys.reduce((sum: string, _key: any) => {
    const val = obj[_key as Key];
    sum += `&${_key.toLowerCase()}=${val}`;
    return sum;
  }, "");
  const signature = sha1(str.substring(1));
  obj.signature = signature;
  obj.appId = APPID;
  return NextResponse.json(obj);
}
function createNonceStr(): string {
  return Math.random().toString(36).substring(2, 25);
}
function createTimeStamp(): string {
  return Number.parseInt(`${Date.now() / 1000}`) + "";
}

export interface WxSign {
  jsapi_ticket: string;
  timestamp: string;
  nonceStr: string;
  url: string;
  appId: string;
  signature: string;
}

export const GET = handle;
export const POST = handle;
