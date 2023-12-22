import RenameIcon from "../icons/rename.svg";
import ReturnIcon from "../icons/return.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";

import { useMobileScreen } from "../utils";
import { DEFAULT_TOPIC, useChatStore, useAppConfig } from "../store";
import { IconButton } from "./button";
import Locale from "../locales";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import styles from "./header.module.scss";

export default function Header() {
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();

  return (
    <div className="window-header">
      {isMobileScreen && (
        <div className="window-actions">
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
          /* onClickCapture={() => setIsEditingMessage(true)} */
        >
          {/* todo 自己实现弹窗 */}
          {!session.topic ? DEFAULT_TOPIC : session.topic}
        </div>
        <div className="window-header-sub-title">
          {Locale.Chat.SubTitle(session.messages.length)}
        </div>
      </div>
      <div className="window-actions">
        {!isMobileScreen && (
          <div className="window-action-button">
            <IconButton
              icon={<RenameIcon />}
              bordered
              /* onClick={() => setIsEditingMessage(true)} */
            />
          </div>
        )}
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
      </div>
    </div>
  );
}
