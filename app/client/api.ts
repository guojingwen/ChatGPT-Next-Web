import { ChatMessage, ModelType, useAccessStore } from "../store";
import { ChatGPTApi } from "./platforms/openai";

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

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  available: boolean;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}

type ProviderName = "openai" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor() {
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [ChatGPT Next Web]: https://github.com/Yidadaa/ChatGPT-Next-Web",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);
    const proxyUrl = "/sharegpt";
    const shareUrl = proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export const api = new ClientApi();

export function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-requested-with": "XMLHttpRequest",
  };
  return headers;
}
