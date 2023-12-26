import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg/lib/fluent-ffmpeg";
import { SpeechTextParams } from "@/app/client/platforms/openai";
const client = new OpenAI({
  apiKey: process.env.API_KEY,
  dangerouslyAllowBrowser: true,
});
export async function apiSpeechToText(
  params: SpeechTextParams,
): Promise<Uint8Array[]> {
  const audio: any = await client.audio.speech.create(params);
  /**
   * 注意 ubuntu 要安装 ffmpeg
   * 参考 https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/442
   * 安装参考 https://blog.csdn.net/weixin_43667077/article/details/122276284
   */
  return await new Promise((resolve) => {
    const chunks: Uint8Array[] = [];
    ffmpeg(audio.body)
      // .outputOptions('-vn', '-ar', '44100', '-ac', '2', '-ab', '192k') // 设置输出为音频参数
      .toFormat("mp3")
      .pipe()
      .on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      })
      .on("end", () => {
        resolve(chunks);
      });
  });
}
