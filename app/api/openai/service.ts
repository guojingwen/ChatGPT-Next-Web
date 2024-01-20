import OpenAI from "openai";
import path from "path";
import { SpeechTextParams } from "@/app/client/platforms/openai";
import request from "request";
import fs from "fs";
import { setTicket } from "../wx/wxService";
import { JsTicket } from "@/app/types/global";
import { ReplaceKeyByType } from "@/app/types/utils";
const ffmpeg = require("fluent-ffmpeg/lib/fluent-ffmpeg");

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  dangerouslyAllowBrowser: true,
  baseURL: "https://chatgpt4.trade/v1",
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

export async function apiSpeechToText2(
  params: SpeechTextParams,
): Promise<string> {
  const audio: any = await client.audio.speech.create(params);
  const fileName = `${Date.now()}.mp3`;
  const filePath = path.join(process.cwd(), `./files/${fileName}`);

  return await new Promise((resolve) => {
    ffmpeg(audio.body)
      .outputOptions("-vn", "-ar", "44100", "-ac", "2", "-ab", "192k") // 设置输出为音频参数
      .output(filePath)
      .on("end", () => {
        resolve(filePath);
      })
      .run();
  });
}

export interface ResWxUpload {
  type: "voice";
  media_id: string;
  created_at: number;
  item: any[];
}
export type ResWxUpload2 = ReplaceKeyByType<ResWxUpload, "media_id", string[]>;

export async function apiUploadVoice(
  readStream: fs.ReadStream,
): Promise<ResWxUpload> {
  const base = "https://api.weixin.qq.com/cgi-bin/media/upload";
  await setTicket();
  const { access_token } = (global as any).jsticket as JsTicket;
  return await new Promise((resolve, reject) => {
    request.post(
      `${base}?access_token=${access_token}&type=voice`,
      {
        formData: {
          media: readStream,
        },
      },
      (err: any, res: any, body: string) => {
        if (err) {
          // todo
          console.log(err);
          reject(err);
          return;
        }
        // '{"errcode":40006,"errmsg":"invalid media size hint: [mdAGVa0368e384] rid: 657d1d7f-3276c861-3eb155dd"}'
        resolve(JSON.parse(body) as ResWxUpload);
      },
    );
  });
}

export async function getAudioDuration(filePath: string) {
  return await new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration!;
        resolve(duration);
      }
    });
  });
}

export async function deleteFile(filePath: string) {
  return await new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
}

export async function splitAudio(
  inputFile: string,
  duration: number,
): Promise<string[]> {
  const outputDirectory = path.dirname(inputFile);
  const ext = path.extname(inputFile);
  const outputFilename = path.basename(inputFile, path.extname(inputFile));
  const segmentDuration = 30;
  return await new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .outputOptions([
        "-f segment", // 设置格式为 segment
        "-segment_time " + segmentDuration, // 设置每个片段的时长
        "-c copy", // 使用同样的编解码器进行复制
        "-reset_timestamps 1", // 重置每个片段的时间戳
      ])
      .output(`${outputDirectory}/${outputFilename}_%01d${ext}`)
      .on("end", () => {
        const count = Math.ceil(duration / segmentDuration);
        const files = Array.from(
          {
            length: count,
          },
          (i, k) => `${outputDirectory}/${outputFilename}_${k}${ext}`,
        );
        resolve(files);
      })
      .on("error", (err: any) => {
        reject(err);
      })
      .run();
  });
}

export const runtime = "nodejs";
