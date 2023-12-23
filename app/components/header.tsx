import RenameIcon from "../icons/rename.svg";
import ReturnIcon from "../icons/return.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import UserIcon from "../icons/user.svg";

import { useMobileScreen } from "../utils";
import { DEFAULT_TOPIC, useChatStore, useAppConfig } from "../store";
import { IconButton } from "./button";
import Locale from "../locales";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import styles from "./header.module.scss";
import { useState } from "react";

export default function Header() {
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const [isRename, setIsRename] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    chatStore.updateCurrentSession(
      (session) => (session.topic = e.target.value),
    );
  };
  const onSave = () => {
    setIsRename(false);
  };
  return (
    <div className={`window-header ${styles["chat-header"]}`}>
      {isMobileScreen && (
        <div className={`window-actions ${styles["chat-back"]}`}>
          <div className={"window-action-button"}>
            <IconButton
              icon={<ReturnIcon />}
              bordered
              title={Locale.Chat.Actions.ChatList}
              onClick={() => navigate(Path.Home)}
            />
          </div>
        </div>
      )}

      <div className={`window-header-title ${styles["chat-body-title"]}`}>
        <div
          className={`window-header-main-title ${styles["chat-body-main-title"]}`}
          onClickCapture={() => setIsRename(true)}
        >
          {isRename ? (
            <>
              <input
                className={`${styles["header-rename-input"]}`}
                type="input"
                value={session.topic || DEFAULT_TOPIC}
                onInput={onChange}
                onBlur={onSave}
              />
              <button
                className={`${styles["header-rename-button"]}`}
                onClick={onSave}
              >
                确定
              </button>
            </>
          ) : (
            <>
              {!session.topic ? DEFAULT_TOPIC : session.topic}
              <RenameIcon className={styles["chat-header-rename"]} />
            </>
          )}
        </div>
        <div className="window-header-sub-title">
          {Locale.Chat.SubTitle(session.messages.length)}
        </div>
      </div>
      <div className={`window-actions ${styles["header-right"]}`}>
        {!isMobileScreen && (
          <div className="window-action-button">
            <IconButton
              icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
              bordered
              onClick={() => {
                config.update(
                  (config) => (config.tightBorder = !config.tightBorder),
                );
              }}
            />
          </div>
        )}
        <div className="window-action-button">
          <IconButton
            icon={<UserIcon />}
            bordered
            onClick={() => navigate(Path.User)}
          />
        </div>
      </div>
    </div>
  );
}
