import styles from "./user.module.scss";
import { useMobileScreen, useNavigate } from "../utils";
import Locale from "../locales";
import { IconButton } from "../components/button";
import ReturnIcon from "../icons/return.svg";
import VIP from "../icons/vip.svg";
import UserAvatar from "../icons/user-avatar.svg";
import { useState } from "react";

const DEFAULT_USER = {
  isLogin: true,
  isVip: false,
  icon: "",
  nickName: "多年以后",
  mid: "4065",
};
type IUser = typeof DEFAULT_USER;

export const User = () => {
  const [userInfo, setUserInfo] = useState<IUser>(DEFAULT_USER);
  return (
    <div className={styles.user}>
      <Header />
      <UserCard user={userInfo} />
      <FunList />
    </div>
  );
};

function FunList() {
  return (
    <div className={styles.user_content}>
      <div className={styles.list}>
        <div className={styles.item}>邀请有礼</div>
      </div>
      <div className={styles.list}>
        <div className={styles.item}>使用教程</div>
        <div className={styles.item}>关于我们</div>
        <div className={styles.item}>意见反馈</div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: IUser }) {
  return (
    <div className={styles.user_card}>
      {user.icon ? (
        <img alt="avatar" src={user.icon} width={30} height={30} />
      ) : (
        <span className={styles.user_card_avatar}>
          <UserAvatar />
        </span>
      )}

      {user.isLogin ? (
        <div className={styles.user_card_info}>
          <span className={styles.user_nickname}>{user.nickName}</span>
          <span>MID: {user.mid}</span>
          {user.isVip ? <span>有效期：2024年6月5日</span> : null}
        </div>
      ) : (
        <div className={styles.user_card_info}>点击登录</div>
      )}

      <div className={styles.user_card_vip}>
        <VIP />
        <span className={styles.user_card_vip_text}>
          VIP会员 ｜ 享无限对话特权
        </span>
        <span className={styles.user_card_vip_buy}>
          {user.isVip ? "已开通" : "立即开通"}
        </span>
      </div>
    </div>
  );
}

function Header() {
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();

  return (
    <div className={`window-header ${styles["user-header"]}`}>
      {isMobileScreen && (
        <div className={`window-actions ${styles["user-back"]}`}>
          <div className={"window-action-button"}>
            <IconButton
              icon={<ReturnIcon />}
              bordered
              title={Locale.Chat.Actions.ChatList}
              onClick={() => navigate(-1)}
            />
          </div>
        </div>
      )}
      <div className={`window-header-title`}>
        <div className={`window-header-main-title`}>个人中心</div>
      </div>
    </div>
  );
}
