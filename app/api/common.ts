import fetch from "node-fetch";
import { NextRequest } from "next/server";
import { OPENAI_BASE_URL } from "../constant";
// import { HttpsProxyAgent } from "https-proxy-agent";
// export const isProd = process.env.NODE_ENV === "production";
// export const agent = isProd
//   ? new HttpsProxyAgent("http://localhost:40000")
//   : undefined;

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController();

  const path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/openai/",
    "",
  );

  console.log("[Proxy] ", path);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const fetchUrl = `${OPENAI_BASE_URL}/${path}`;
  const body = await readStream(req.body!);
  const fetchOptions: any = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
    method: req.method,
    body: body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    // redirect: "manual",
    // @ts-ignore
    // duplex: "half",
    signal: controller.signal,
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers as any);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    return new Response(res.body as any, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readStream(readableStream: ReadableStream<Uint8Array>) {
  const reader = readableStream.getReader();
  let chunks = []; // 用于存储数据块

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

export const runtime = "nodejs";
