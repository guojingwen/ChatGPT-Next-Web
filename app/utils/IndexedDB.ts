"use client";

import { IDB_CONST } from "../constant";

let _resolve: (value: IDBDatabase) => any, _reject: (value: unknown) => any;
let dbInstance: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  _resolve = resolve;
  _reject = reject;
});
// const request = window.indexedDB.open("ai-teacher", 1);
const request =
  typeof window !== "undefined"
    ? window.indexedDB.open("ai-teacher", 1)
    : ({} as IDBOpenDBRequest);

request.onerror = function (event) {
  console.log("onerror", event);
  _reject(event);
  console.log("数据库打开报错");
};

// 如果当前数据版本大于实际数据库版本，就会发生数据库升级事件
request.onupgradeneeded = function (event) {
  console.log("onupgradeneeded", event);
  // 这里可以修改数据库结构（新增或删除表、索引或者主键)
  // 注意： 所有与表结构相关的都要写在这里
  const db = (event.target as any).result as IDBDatabase;
  const names = db.objectStoreNames;
  const { MESSAGE_STORE, AUDIO_STORE } = IDB_CONST;
  if (!names.contains(MESSAGE_STORE)) {
    db.createObjectStore(MESSAGE_STORE, {
      keyPath: "id",
    });
    db.createObjectStore(AUDIO_STORE, {
      autoIncrement: true,
    });
  }
};
request.onsuccess = async function (event) {
  // console.log('onsuccess', event);
  _resolve(request.result);
  console.log("数据库打开成功");
  (window as any).myDb = request.result;
};

export default dbInstance;

export function makeResp(request: IDBRequest): Promise<null> {
  return new Promise((resolve, reject) => {
    request.onsuccess = function (event) {
      resolve(null);
    };
    request.onerror = function (err) {
      reject(err);
    };
  });
}
