import { useDebouncedCallback } from "use-debounce";
import React, { useState, useRef, useEffect, useMemo, Fragment } from "react";

import SendWhiteIcon from "../icons/send-white.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import PromptIcon from "../icons/prompt.svg";
import ResetIcon from "../icons/reload.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/clear.svg";
import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import RobotIcon from "../icons/robot.svg";
import IconKeyboard from "../icons/keyboard.svg";
import IconVoice from "../icons/voice.svg";
import IconSelect from "../icons/select.svg";
import AudioIcon from "../icons/audio.svg";

import { fetchSpeechText, fetchSpeechText2 } from "../client/platforms/openai";

import {
  SubmitKey,
  useChatStore,
  createMessage,
  Theme,
  useAppConfig,
  ModelType,
} from "../store";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
  useNavigate,
  audioInst,
  getDeviceInfo,
} from "../utils";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { usePromptStore } from "../store/prompt";

import Locale from "../locales";

import { IconButton } from "../components/button";
import styles from "./chat.module.scss";

import { Selector, showToast } from "../components/ui-lib";
import {
  CHAT_PAGE_SIZE,
  LAST_INPUT_KEY,
  Path,
  UNFINISHED_INPUT,
} from "../constant";
import { Avatar } from "../components/emoji";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { useGetState } from "../utils/hooks";
import Header from "../components/header";
import PromptHints, { type RenderPompt } from "../components/prompt-hints";
import MaskAvatar from "../components/mask-avatar";
import SessionConfigModel from "../components/session-config-model";
import {
  ChatMessage,
  deleteMessage,
  getMessagesBySessionId,
  updateMessage,
} from "../store/message";
import { api } from "../client/api";
import { prettyObject } from "../utils/format";
import { addAudio, getAudio, deleteAudio } from "../store/audioStore";
import { sleep } from "../utils/sync";
// import { sleep } from "openai/core";

const device = getDeviceInfo();

const Markdown = dynamic(
  async () => (await import("../components/markdown")).Markdown,
  {
    loading: () => <LoadingIcon />,
  },
);

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

function ClearContextDivider() {
  return (
    <div className={styles["clear-context"]}>
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
    </div>
  );
}

function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  customClass?: string;
  onClick: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <div
      className={`${styles["chat-input-action"]} ${
        props.customClass ? styles[`chat-action-${props.customClass}`] : ""
      } clickable`}
      onClick={() => {
        props.onClick();
        setTimeout(updateWidth, 1);
      }}
      onMouseEnter={updateWidth}
      onTouchStart={updateWidth}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      {!device.isMobile && (
        <div className={styles["text"]} ref={textRef}>
          {props.text}
        </div>
      )}
    </div>
  );
}

function useScrollToBottom() {
  // for auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  function scrollDomToBottom() {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }

  // auto scroll
  useEffect(() => {
    if (autoScroll) {
      scrollDomToBottom();
    }
  });

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
  };
}

type InputType = "Keyboard" | "Voice";

export function ChatActions(props: {
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  switchInputType: (type: InputType) => void;
  inputType: InputType;
}) {
  const config = useAppConfig();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  // switch model
  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const { models: allModels } = useAppConfig();
  const models = useMemo(
    () => allModels.filter((m) => m.available),
    [allModels],
  );
  const [showModelSelector, setShowModelSelector] = useState(false);

  useEffect(() => {
    // if current model is not available
    // switch to first available model
    const isUnavaliableModel = !models.some((m) => m.name === currentModel);
    if (isUnavaliableModel && models.length > 0) {
      const nextModel = models[0].name as ModelType;
      chatStore.updateCurrentSession(
        (session) => (session.mask.modelConfig.model = nextModel),
      );
      showToast(nextModel);
    }
  }, [chatStore, currentModel, models]);
  const [isGranted, setIsGranted] = useState<boolean>(
    window.isVoiceGrantPrivilege,
  );
  const switchInputType = async () => {
    // 切到声音，未开启音频
    const isInput = props.inputType === "Keyboard";
    if (isInput && !isGranted) {
      await new Promise((resolve) => {
        window.wx.startRecord({
          success() {
            if (!window.isVoiceGrantPrivilege) {
              window.isVoiceGrantPrivilege = true;
              setIsGranted(true);
              // Toast.show('已开启音频权限');
              setTimeout(() => {
                window.wx.stopRecord();
              }, 50);
              resolve(null);
            }
          },
        });
      });
    }
    props.switchInputType(isInput ? "Voice" : "Keyboard");
  };

  return (
    <div className={styles["chat-input-actions"]}>
      {couldStop && (
        <ChatAction
          onClick={stopAll}
          text={Locale.Chat.InputActions.Stop}
          icon={<StopIcon />}
        />
      )}
      {!props.hitBottom && (
        <ChatAction
          onClick={props.scrollToBottom}
          text={Locale.Chat.InputActions.ToBottom}
          icon={<BottomIcon />}
        />
      )}
      {props.hitBottom && (
        <ChatAction
          onClick={props.showPromptModal}
          text={Locale.Chat.InputActions.Settings}
          icon={<SettingsIcon />}
        />
      )}

      <ChatAction
        onClick={nextTheme}
        text={Locale.Chat.InputActions.Theme[theme]}
        icon={
          <>
            {theme === Theme.Auto ? (
              <AutoIcon />
            ) : theme === Theme.Light ? (
              <LightIcon />
            ) : theme === Theme.Dark ? (
              <DarkIcon />
            ) : null}
          </>
        }
      />

      <ChatAction
        onClick={props.showPromptHints}
        text={Locale.Chat.InputActions.Prompt}
        icon={<PromptIcon />}
      />

      <ChatAction
        text={Locale.Chat.InputActions.Clear}
        icon={<BreakIcon />}
        onClick={() => {
          chatStore.updateCurrentSession((session) => {
            session.clearContextIndex = session.msgCount;
            session.memoryPrompt = ""; // will clear memory
          });
        }}
      />

      {/* <ChatAction
        onClick={() => setShowModelSelector(true)}
        text={currentModel}
        icon={<RobotIcon />}
      /> */}
      {device.isWeixin && (
        <ChatAction
          onClick={switchInputType}
          text={
            Locale.Chat.InputActions[
              props.inputType === "Keyboard" ? "Voice" : "Keyboard"
            ]
          }
          icon={
            props.inputType === "Keyboard" ? <IconVoice /> : <IconKeyboard />
          }
        />
      )}

      {showModelSelector && (
        <Selector
          defaultSelectedValue={currentModel}
          items={models.map((m) => ({
            title: m.name,
            value: m.name,
          }))}
          onClose={() => setShowModelSelector(false)}
          onSelection={(s: any[]) => {
            if (s.length === 0) return;
            chatStore.updateCurrentSession((session) => {
              session.mask.modelConfig.model = s[0] as ModelType;
              session.mask.syncGlobalConfig = false;
            });
            showToast(s[0]);
          }}
        />
      )}
    </div>
  );
}

function _Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const fontSize = config.fontSize;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const [messages, _setMessages, getMessages] = useGetState<ChatMessage[]>([]);
  const setMessages = (list: ChatMessage[]) => {
    session.msgCount = list.length;
    _setMessages(list);
  };
  useEffect(() => {
    getMessagesBySessionId(session.id).then((list) => {
      list.forEach((it) => {
        const hasAudio = it.audioKey || it.audioIds?.length;
        it.audioState = hasAudio ? "done" : "none";
      });
      setMessages(list);
    });
  }, [session.id]);

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateCurrentSession(
        (session) => (session.clearContextIndex = session.msgCount),
      ),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.startsWith(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = async (userInput: string) => {
    if (userInput.trim() === "") return;
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    await onUserInput(userInput);
    localStorage.setItem(LAST_INPUT_KEY, userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };
  const onUserInput = async (content: string) => {
    const session = chatStore.currentSession();
    const modelConfig = session.mask.modelConfig;

    const now = Date.now();
    const userMessage: ChatMessage = createMessage({
      role: "user",
      content,
      sessionId: session.id,
      id: `${now}`,
    });

    const botMessage: ChatMessage = createMessage({
      role: "assistant",
      streaming: true,
      model: modelConfig.model,
      sessionId: session.id,
      id: `${now + 1}`,
    });
    setMessages(getMessages().concat([userMessage, botMessage]));
    await updateMessage(userMessage, "add");
    await updateMessage(botMessage, "add");
    chatStore.updateCurrentSession((session) => {
      session.lastMsgId = `${botMessage.id}`;
    });
    // make request
    const recentMessages = await chatStore.getMessagesWithMemory();
    const sendMessages = recentMessages.concat(userMessage);
    api.llm.chat({
      messages: sendMessages,
      config: { ...modelConfig, stream: true },
      onUpdate: (message) => {
        botMessage.streaming = true;
        botMessage.content = message;
        const lastMsg = { ...botMessage };
        const msgs = getMessages();
        setMessages(msgs.slice(0, msgs.length - 1).concat([lastMsg]));
        updateMessage(botMessage);
      },
      onFinish: async (message) => {
        botMessage.streaming = false;
        if (message) {
          botMessage.content = message;
          updateMessage(botMessage);
          const lastMsg = { ...botMessage };
          const msgs = getMessages();
          setMessages(msgs.slice(0, msgs.length - 1).concat([lastMsg]));
          chatStore.onNewMessage(botMessage);
          if (inputType === "Voice") {
            toSpeak(lastMsg);
          }
        }
        ChatControllerPool.remove(session.id, botMessage.id);
      },
      onError: async (error) => {
        const isAborted = error.message.includes("aborted");
        botMessage.content +=
          "\n\n" +
          prettyObject({
            error: true,
            message: error.message,
          });
        botMessage.streaming = false;
        userMessage.isError = !isAborted;
        botMessage.isError = !isAborted;
        await updateMessage(userMessage);
        await updateMessage(botMessage);
        const msgs = getMessages();
        setMessages(
          msgs.slice(0, msgs.length - 2).concat([userMessage, botMessage]),
        );
        ChatControllerPool.remove(session.id, botMessage.id);

        console.error("[Chat] failed ", error);
      },
      onController(controller) {
        ChatControllerPool.addController(session.id, botMessage.id, controller);
      },
    });
  };

  const onPromptSelect = (prompt: RenderPompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, message.content)) {
      if (userInput.length === 0) {
        setUserInput(message.content);
      }

      e.preventDefault();
    }
  };

  const onDelete = async (message: ChatMessage) => {
    const list = getMessages().slice();
    const index = list.findIndex((it) => it.id === message.id);
    list.splice(index, 1);
    setMessages(list);
    await deleteMessage(message.id);
    if (message.audioKey) {
      await deleteAudio(message.audioKey);
    }
  };

  const onResend = async (message: ChatMessage) => {
    // 1. 删除当前(AI)消息 和前一条（用户）消息
    // 2. 重新发送
    const messages = await getMessagesBySessionId(message.sessionId!);
    const resendingIndex = messages.findIndex((m) => m.id === message.id);

    const botMessage = messages[resendingIndex];
    const userMessage = messages[resendingIndex - 1];
    await deleteMessage(userMessage.id);
    await deleteMessage(botMessage.id);
    const list = getMessages();
    list.splice(resendingIndex - 1, 2);
    setMessages(list);
    if (botMessage.audioKey) {
      await deleteAudio(botMessage.audioKey);
    }
    await onUserInput(userMessage.content);
    inputRef.current?.focus();
  };

  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);

  // preview messages
  const renderMessages = useMemo(() => {
    return context.concat(messages as RenderMessage[]).concat(
      userInput.length > 0 && config.sendPreviewBubble
        ? [
            {
              ...createMessage({
                role: "user",
                content: userInput,
              }),
              preview: true,
            },
          ]
        : [],
    );
  }, [config.sendPreviewBubble, context, messages, userInput]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const _messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    const list = renderMessages.slice(msgRenderIndex, endRenderIndex);
    return list;
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen

  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (code) => {
      // todo微信授权登录
      console.log("todo微信授权登录", code);
    },
  });

  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(key, dom?.value ?? "");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [inputType, switchInputType] = useState<InputType>("Keyboard");

  /* 语音功能相关 */
  const [isRecording, setIsRecording] = useState(false);
  const start = async () => {
    /* if (!userState.isLogin) {
      events.emit('needLogin');
      return;
    } */
    setIsRecording(true);
    window.wx.startRecord();
  };
  let localId: string | null = null;
  useEffect(() => {
    // ?. 适配PC环境
    window.wx?.onVoiceRecordEnd({
      // 录音时间超过一分钟没有停止的时候会执行 complete 回调
      complete: function (res: { localId: string }) {
        showToast("微信限制，录音时间超过一分钟自动停止");
        localId = res.localId;
        setIsRecording(false);
        toConvert(localId);
      },
    });
  }, []);
  const end = () => {
    window.wx.stopRecord({
      success: function (res: { localId: string }) {
        localId = res.localId;
        setIsRecording(false);
        toConvert(localId);
      },
      error(err: any) {
        setIsRecording(false);
      },
    });
  };
  async function toConvert(localId: string) {
    window.wx.translateVoice({
      localId, // 需要识别的音频的本地Id，由录音相关接口获得
      isShowProgressTips: 0, // 默认为1，显示进度提示
      success: function (res: { translateResult: string }) {
        const text = res.translateResult;
        doSubmit(text);
      },
      error(err: any) {
        showToast("微信语音识别错误");
      },
    });
  }
  const toSpeak = async (item: RenderMessage) => {
    if (item.audioState === "playing") {
      audioInst.stop();
      item.audioState = "done";
      setMessages(getMessages().slice());
      return;
    }
    const old = audioInst.getAddi() as RenderMessage;
    if (old) {
      audioInst.stop();
      await sleep(20);
      const newList = getMessages().slice();
      const index = newList.findIndex((it) => it.id === old.id);
      newList.splice(index, 1, {
        ...old,
        audioState: "done",
      });
      setMessages(newList);
    }
    if (device.isAndroid) {
      let audioBase64: string;
      if (!item.audioKey) {
        item.audioState = "loading";
        setMessages(getMessages().slice());
        const res = await fetchSpeechText(item.content);
        audioBase64 = res.audioBase64;
        const audioKey = await addAudio(audioBase64);
        item.audioKey = audioKey;
      } else {
        audioBase64 = await getAudio(item.audioKey);
      }
      item.audioState = "playing";
      setMessages(getMessages().slice());
      updateMessage(item);
      await audioInst.play(audioBase64, item);
      item.audioState = "done";
      setMessages(getMessages().slice());
    } else {
      let audioIds = item.audioIds;
      if (!item.audioIds?.length) {
        item.audioState = "loading";
        setMessages(getMessages().slice());
        const res = await fetchSpeechText2(item.content);
        audioIds = await audioInst.downloadAudios(res.media_id);
        item.audioIds = audioIds;
        updateMessage(item);
      }
      item.audioState = "playing";
      setMessages(getMessages().slice());
      await audioInst.playIOS(audioIds!, item);
      item.audioState = "done";
      setMessages(getMessages().slice());
    }
  };
  return (
    <div className={styles.chat} key={session.id}>
      <Header />
      {showPromptModal && (
        <SessionConfigModel onClose={() => setShowPromptModal(false)} />
      )}
      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onMouseDown={() => inputRef.current?.blur()}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {_messages.map((message, i) => {
          const isUser = message.role === "user";
          const isContext = i < context.length;
          const showActions =
            !(message.preview || message.content.length === 0) && !isContext;
          const showTyping = message.preview || message.streaming;

          const shouldShowClearContextDivider = i === clearContextIndex - 1;

          return (
            <Fragment key={message.id}>
              <div
                className={
                  isUser ? styles["chat-message-user"] : styles["chat-message"]
                }
              >
                <div className={styles["chat-message-container"]}>
                  <div className={styles["chat-message-header"]}>
                    <div className={styles["chat-message-avatar"]}>
                      {isContext ? null : isUser ? (
                        <Avatar avatar={config.avatar} />
                      ) : (
                        <>
                          {["system"].includes(message.role) ? (
                            <Avatar avatar="2699-fe0f" />
                          ) : (
                            <MaskAvatar
                              avatar={session.mask.avatar}
                              model={
                                message.model || session.mask.modelConfig.model
                              }
                            />
                          )}
                        </>
                      )}
                    </div>

                    {showActions && (
                      <div className={styles["chat-message-actions"]}>
                        <div className={styles["chat-input-actions"]}>
                          {message.streaming ? (
                            <ChatAction
                              text={Locale.Chat.Actions.Stop}
                              icon={<StopIcon />}
                              onClick={() => onUserStop(message.id ?? i)}
                            />
                          ) : (
                            <>
                              {!isUser ? (
                                <ChatAction
                                  text={Locale.Chat.Actions.Retry}
                                  icon={<ResetIcon />}
                                  onClick={() => onResend(message)}
                                />
                              ) : null}

                              <ChatAction
                                text={Locale.Chat.Actions.Delete}
                                icon={<DeleteIcon />}
                                onClick={() => onDelete(message)}
                              />
                              <ChatAction
                                text={Locale.Chat.Actions.Copy}
                                icon={<CopyIcon />}
                                onClick={() => copyToClipboard(message.content)}
                              />
                              {!isUser && device.isWeixin ? (
                                <ChatAction
                                  customClass={message.audioState}
                                  text={Locale.Chat.Actions.Voice}
                                  icon={
                                    <AudioIcon
                                      className={
                                        styles[
                                          `chat-action-${message.audioState}`
                                        ]
                                      }
                                    />
                                  }
                                  onClick={() => toSpeak(message)}
                                />
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {showTyping && (
                    <div className={styles["chat-message-status"]}>
                      {Locale.Chat.Typing}
                    </div>
                  )}
                  <div className={styles["chat-message-item"]}>
                    <Markdown
                      content={message.content}
                      loading={
                        (message.preview || message.streaming) &&
                        message.content.length === 0 &&
                        !isUser
                      }
                      onContextMenu={(e) => onRightClick(e, message)}
                      fontSize={fontSize}
                      parentRef={scrollRef}
                      defaultShow={i >= messages.length - 6}
                    />
                  </div>

                  <div className={styles["chat-message-action-date"]}>
                    {isContext
                      ? Locale.Chat.IsContext
                      : config.showMsgTime
                        ? message.date.toLocaleString()
                        : null}
                  </div>
                </div>
              </div>
              {shouldShowClearContextDivider && <ClearContextDivider />}
            </Fragment>
          );
        })}
      </div>
      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          inputType={inputType}
          switchInputType={switchInputType}
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottom}
          hitBottom={hitBottom}
          showPromptHints={() => {
            // Click again to close
            if (promptHints.length > 0) {
              setPromptHints([]);
              return;
            }

            inputRef.current?.focus();
            setUserInput("/");
            onSearch("");
          }}
        />
        {inputType === "Keyboard" ? (
          <div className={styles["chat-input-panel-inner"]}>
            <textarea
              ref={inputRef}
              className={styles["chat-input"]}
              placeholder={Locale.Chat.Input(submitKey)}
              onInput={(e) => onInput(e.currentTarget.value)}
              value={userInput}
              onKeyDown={onInputKeyDown}
              onFocus={scrollToBottom}
              onClick={scrollToBottom}
              rows={inputRows}
              autoFocus={autoFocus}
              style={{
                fontSize: config.fontSize,
              }}
            />
            <IconButton
              icon={<SendWhiteIcon />}
              text={Locale.Chat.Send}
              className={styles["chat-input-send"]}
              type="primary"
              onClick={() => doSubmit(userInput)}
            />
          </div>
        ) : (
          <div
            className={styles.chat_voice}
            onTouchStart={start}
            onTouchEnd={end}
            style={{
              borderColor: isRecording ? `red` : `var(--primary)`,
            }}
          >
            <span
              className={styles.voice_on_tip}
              style={{
                display: isRecording ? "inline-block" : "none",
              }}
            >
              松开发送
            </span>
            <IconSelect className={styles.chat_voice_icon} />
            {Locale.Chat.VoiceTip}
            <IconVoice
              className={styles.chat_voice_voice}
              style={{
                fill: isRecording ? `red` : `var(--primary)`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function Chat() {
  const chatStore = useChatStore();
  const sessionIndex = chatStore.currentSessionIndex;
  return <_Chat key={sessionIndex}></_Chat>;
}
