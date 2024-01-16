import dbInstance from "../utils/IndexedDB";
import { IDB_CONST } from "../constant";
import { RequestMessage } from "../client/api";
import { ModelType } from "./config";

const { MESSAGE_STORE } = IDB_CONST;
export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  sessionId: string;
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
  const transaction = db.transaction([MESSAGE_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  const request = objectStore.getAll();
  await new Promise((resolve) => {
    request.onsuccess = (e) => {
      let list = (e.target as IDBRequest<ChatMessage[]>).result;
      list.forEach((item) => {
        if (item.sessionId === sessionId) {
          objectStore.delete(item.id);
          // if (item.audioKey) {
          //   objectStore3.delete(item.audioKey);
          // }
        }
      });
      resolve(null);
    };
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
  objectStore[type](_msg);
}
export async function deleteMessage(id: string) {
  const db = await dbInstance;
  const transaction = db.transaction([MESSAGE_STORE], "readwrite");
  const objectStore = transaction.objectStore(MESSAGE_STORE);
  objectStore.delete(id); // todo
}
