import dbInstance, { makeResp } from "../utils/IndexedDB";
import { IDB_CONST } from "../constant";
import { RequestMessage } from "../client/api";
import { ModelType } from "./config";

const { MESSAGE_STORE, AUDIO_STORE } = IDB_CONST;
export type AudioState = "none" | "loading" | "playing" | "done";
export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: number;
  model?: ModelType;
  sessionId: string;
  audioState: AudioState;
  audioKey: number; // android or other
  audioIds: string[]; // ios
};

export async function getMessagesBySessionId(
  sessionId: string,
): Promise<ChatMessage[]> {
  const db = await dbInstance;
  const transaction = db.transaction([IDB_CONST.MESSAGE_STORE], "readonly");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const request = objectStore.openCursor();
  const list: ChatMessage[] = [];
  return new Promise((resolve) => {
    request.onsuccess = (e) => {
      let cursor = (e.target as any).result;
      if (cursor) {
        const item = cursor.value as ChatMessage;
        if (item.sessionId === sessionId) {
          list.push(item);
        }
        cursor.continue();
      } else {
        resolve(list);
      }
    };
  });
}
export async function removeMessagesBySessionId(
  sessionId: string,
): Promise<void> {
  const db = await dbInstance;
  const transaction = db.transaction([MESSAGE_STORE, AUDIO_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const objectStoreA = transaction.objectStore(AUDIO_STORE);
  const request = objectStore.getAll();
  await new Promise((resolve) => {
    request.onsuccess = async (e) => {
      let list = (e.target as IDBRequest<ChatMessage[]>).result;
      for (let item of list) {
        if (item.sessionId === sessionId) {
          objectStore.delete(item.id);
          const key = item.audioKey;
          if (item.audioKey) {
            objectStoreA.delete(key);
          }
        }
        resolve(null);
      }
    };
  });
  await new Promise((resolve) => {
    transaction.oncomplete = () => resolve(null);
  });
}
export async function updateMessage(
  message: ChatMessage,
  type: "put" | "add" = "put",
) {
  const db = await dbInstance;
  const _msg = {
    ...message,
  };
  // delete _msg.audioState; // 这个字段不入库
  // delete _msg.audioBase64; // 这个字段不入库
  const transaction = db.transaction([MESSAGE_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const request = objectStore[type](_msg);
  return makeResp(request);
}
export async function deleteMessage(id: number) {
  const db = await dbInstance;
  const transaction = db.transaction([MESSAGE_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const request = objectStore.delete(id);
  return makeResp(request);
}

export async function clearMesssage() {
  const db = await dbInstance;
  const transaction = db.transaction([MESSAGE_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const clearRequest = objectStore.clear();
  return makeResp(clearRequest);
}
