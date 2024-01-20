import { SpeechTextParams } from "@/app/client/platforms/openai";
import { NextRequest, NextResponse } from "next/server";
import {
  apiSpeechToText2,
  apiUploadVoice,
  getAudioDuration,
  deleteFile,
  splitAudio,
} from "../service";
import fs from "fs";

// ios音频播放通过中转
async function handle(req: NextRequest): Promise<
  NextResponse<{
    media_id: string[];
    type: "voice";
    created_at: number;
    item: any[];
  }>
> {
  const body: SpeechTextParams = await req.json();
  const filePath = await apiSpeechToText2(body);
  const duration = await getAudioDuration(filePath);
  if (duration < 30) {
    const readStream = fs.createReadStream(filePath);
    const res = await apiUploadVoice(readStream);
    void deleteFile(filePath);
    return NextResponse.json({
      ...res,
      media_id: [res.media_id],
    });
  }
  const files = await splitAudio(filePath, duration);
  const reses = await Promise.all(
    files.map((filePath) => apiUploadVoice(fs.createReadStream(filePath))),
  );
  void deleteFile(filePath);
  files.map((file) => deleteFile(file));
  return NextResponse.json({
    ...reses[0],
    media_id: reses.map((it) => it.media_id),
  });
}

// export const GET = handle;
export const POST = handle;
export const runtime = "nodejs";
