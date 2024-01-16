import { ModelType } from "../store";
import { ChatGPTApi } from "./platforms/openai";
import { MyResponse, ResUserInfo, WxResError, WxSign } from "../apiType";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface RequestMessage {
  role: MessageRole;
  content: string;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMModel {
  name: string;
  available: boolean;
}
export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
}

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}
}

export const api = new ClientApi();

export function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
  };
  return headers;
}

export async function fetchWxAuth(code: string) {
  const res = await fetch(`/api/wx/auth?code=${code}`, {
    method: "GET",
  }).then((res) => res.json());
  return res as MyResponse<ResUserInfo> | WxResError;
}

export async function fetchWxJsSdk() {
  const url = encodeURIComponent(window.location.href.split("#")[0]);
  const res = await fetch(`/api/wx/jsapi?url=${url}`).then((res) => res.json());
  return res as WxSign;
}
