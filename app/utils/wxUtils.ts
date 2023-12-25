"use client";

import { fetchWxJsSdk } from "../client/api";

export let wxResolve: (value: unknown) => void;
export const wxPromise = new Promise((_resolve) => {
  wxResolve = _resolve;
});

export const initWx = () => {
  fetchWxJsSdk().then((res) => {
    const _config = {
      debug: true,
      appId: res.appId,
      timestamp: res.timestamp,
      nonceStr: res.nonceStr,
      signature: res.signature,
      jsApiList: [
        "checkJsApi",
        "startRecord",
        "stopRecord",
        "onRecordEnd",
        "playVoice",
        "stopVoice",
        "downloadVoice",
        "pauseVoice",
        "uploadVoice",
        "translateVoice",
      ], // 必填，需要使用的JS接口列表
    };
    window.wx.config(_config);
    window.wx.ready(function () {
      wxResolve(window.wx);
    });
  });
};
