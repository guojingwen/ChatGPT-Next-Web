import { SpeechTextParams } from "@/app/client/platforms/openai";
import { NextRequest, NextResponse } from "next/server";
import { apiSpeechToText } from "../service";

async function handle(req: NextRequest) {
  const body: SpeechTextParams = await req.json();
  const chunks = await apiSpeechToText(body);
  const buffer = Buffer.concat(chunks);
  const audioBase64 = "data:audio/mp3;base64," + buffer.toString("base64");
  return NextResponse.json({
    audioBase64,
  });
}

// export const GET = handle;
export const POST = handle;
export const runtime = "nodejs";
