import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
const device = getDeviceInfo();
export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the specified punctuation from the end of the string
  // and also trim quotes from both the start and end if they exist.
  return topic
    .replace(/^["“”]+|["“”]+$/g, "")
    .replace(/[，。！？”“"、,.!?]*$/, "");
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);

    showToast(Locale.Copy.Success);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(Locale.Copy.Success);
    } catch (error) {
      showToast(Locale.Copy.Failed);
    }
    document.body.removeChild(textArea);
  }
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 600;
export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function isFirefox() {
  return (
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
  );
}

export function selectOrCopy(el: HTMLElement, content: string) {
  const currentSelection = window.getSelection();

  if (currentSelection?.type === "Range") {
    return false;
  }

  copyToClipboard(content);

  return true;
}

function getDomContentWidth(dom: HTMLElement) {
  const style = window.getComputedStyle(dom);
  const paddingWidth =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = dom.clientWidth - paddingWidth;
  return width;
}

function getOrCreateMeasureDom(id: string, init?: (dom: HTMLElement) => void) {
  let dom = document.getElementById(id);

  if (!dom) {
    dom = document.createElement("span");
    dom.style.position = "absolute";
    dom.style.wordBreak = "break-word";
    dom.style.fontSize = "14px";
    dom.style.transform = "translateY(-200vh)";
    dom.style.pointerEvents = "none";
    dom.style.opacity = "0";
    dom.id = id;
    document.body.appendChild(dom);
    init?.(dom);
  }

  return dom!;
}

export function autoGrowTextArea(dom: HTMLTextAreaElement) {
  const measureDom = getOrCreateMeasureDom("__measure");
  const singleLineDom = getOrCreateMeasureDom("__single_measure", (dom) => {
    dom.innerText = "TEXT_FOR_MEASURE";
  });

  const width = getDomContentWidth(dom);
  measureDom.style.width = width + "px";
  measureDom.innerText = dom.value !== "" ? dom.value : "1";
  measureDom.style.fontSize = dom.style.fontSize;
  const endWithEmptyLine = dom.value.endsWith("\n");
  const height = parseFloat(window.getComputedStyle(measureDom).height);
  const singleLineHeight = parseFloat(
    window.getComputedStyle(singleLineDom).height,
  );

  const rows =
    Math.round(height / singleLineHeight) + (endWithEmptyLine ? 1 : 0);

  return rows;
}

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

/**
 * Detects Macintosh
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window !== "undefined") {
    if (window.devices) return window.devices;
    const ua = navigator.userAgent;
    const uaL = ua.toLocaleLowerCase();
    window.devices = {
      isAndroid: !/Android/.test(ua),
      isIos: /iphone|ipad|ipod/.test(uaL),
      isMobile: /Android|iPhone/i.test(ua),
      isSafari: /^((?!chrome|android).)*safari/i.test(ua),
      isMacOS: /iphone|ipad|ipod|macintosh/.test(uaL),
      isWeixin: /MicroMessenger/i.test(ua),
    };
    return window.devices;
  }
  return {} as DeviceInfo;
}

/* react-router 与 next/route冲突，故自定义useNavigate */
const stack: string[] = [];
export function useNavigate() {
  return (path: string | number) => {
    if (path === -1) {
      if (stack.length) {
        stack.pop();
        history.back();
      } else {
        const isHome = !(
          location.hash === "#/" || location.hash.startsWith("#/?")
        );
        if (!isHome) {
          location.href = `#/`;
        }
      }
    } else {
      stack.push(path as string);
      location.href = `#${path}`;
    }
  };
}

class AudioPlayImpl<T extends object = {}> {
  protected audioElement?: HTMLAudioElement;
  protected addition: T | null | undefined = null;
  protected _reject: ((value: unknown) => void) | null | undefined = null;
  protected cb: Function | null | undefined = null;
  protected localIds: string[] = [];
  public constructor() {
    if (typeof window !== "undefined") {
      this.audioElement = new window.Audio();
      this.audioElement.addEventListener("ended", () => this.ended());
    }
  }
  async play(src: string, addition: T): Promise<T> {
    return new Promise((resolve) => {
      this.audioElement!.src = src;
      this.addition = addition;
      this.cb = (arg: T) => {
        resolve(arg);
      };
      this.audioElement!.play();
    });
  }
  async downloadAudios(arr: string[]) {
    const localIds: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      const localId: string = await new Promise((resolve) => {
        window.wx.downloadVoice({
          serverId: arr[i], // 需要下载的音频的服务器端ID，由uploadVoice接口获得
          isShowProgressTips: 0, // 默认为1，显示进度提示
          success: function (res: any) {
            resolve(res.localId); // 返回音频的本地ID
          },
          error: function (res: any) {
            alert("downloadVoice error" + res.localId);
          },
        });
      });
      localIds.push(localId);
    }
    return localIds;
  }
  async playIOS(localIds: string[], addition: T) {
    this.localIds = localIds.slice();
    let localId: string;
    try {
      const racePromise = new Promise((resolve, reject) => {
        this._reject = () => {
          if (localId) {
            window.wx.stopVoice({
              localId,
            });
          }
          reject();
        };
        this.addition = addition;
      });
      while (this.localIds.length) {
        localId = this.localIds.shift()!;
        window.wx.playVoice({
          localId,
        });
        let _resolve: (value: unknown) => void;
        window.wx.onVoicePlayEnd({
          success: function (res: any) {
            _resolve(res.localId);
          },
        });
        await Promise.race([
          new Promise((resolve) => {
            _resolve = resolve;
          }),
          racePromise,
        ]);
      }
      this.addition = null;
      this.localIds = [];
    } catch {
      this.addition = null;
      this.localIds = [];
    }
  }
  private ended() {
    this.cb?.(this.addition);
    this.addition = null;
    this.cb = null;
  }
  stop() {
    if (device.isAndroid) {
      this.audioElement!.currentTime = 0;
      this.audioElement!.pause();
      this.addition = null;
      this.cb = null;
    } else {
      if (this._reject instanceof Function) {
        this._reject(this.addition);
      }
      this.addition = null;
      this.localIds = [];
    }
  }
  getAddi(): T | null | undefined {
    return this.addition;
  }
}

export const audioInst = new AudioPlayImpl<object>();
