"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";

import BotIcon from "../icons/bot.svg";
import LoadingIcon from "../icons/three-dots.svg";

import { getDeviceInfo, getCSSVar, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "../components/error";

import { getISOLang } from "../locales";

import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { getClientConfig } from "../config/client";
import { initWx } from "../utils/wxUtils";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const User = dynamic(async () => (await import("./user")).User, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

// const Error = dynamic(async () => (await import("./error")).ErrorBoundary, {
//   loading: () => <Loading noLogo />,
// });

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

function Screen() {
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const shouldTightBorder = config.tightBorder && !isMobileScreen;

  useEffect(() => {
    if (getDeviceInfo().isWeixin) {
      initWx();
    }
  }, []);

  return (
    <div
      className={
        styles.container +
        ` ${shouldTightBorder ? styles["tight-container"] : styles.container} `
      }
    >
      <SideBar />

      <div className={styles["window-content"]} id={SlotID.AppBody}>
        <Routes>
          <Route path={Path.Home} element={!isMobileScreen ? <Chat /> : null} />
          <Route path={Path.NewChat} element={<NewChat />} />
          <Route path={Path.Masks} element={<MaskPage />} />
          <Route path={Path.Chat} element={<Chat />} />
          {/* <Route path={Path.Error} element={<Error />} /> */}
          <Route path={Path.Settings} element={<Settings />} />
          <Route path={Path.User} element={<User />} />
        </Routes>
      </div>
    </div>
  );
}

export function Home() {
  useSwitchTheme();
  useHtmlLang();

  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
