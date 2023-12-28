import React from "react";
import { IconButton } from "./button";
import ResetIcon from "../icons/reload.svg";
import Locale from "../locales";
import { showConfirm } from "./ui-lib";
import { exportFile } from "../utils/syncFile";

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<any, IErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Update state with error details
    this.setState({ hasError: true, error, info });
    console.log("上报错误");
  }

  clearAndSaveData() {
    try {
      exportFile();
    } finally {
      localStorage.clear();
      location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Render error message
      return (
        <div className="error">
          <h3>很抱歉，出了一些问题，错误日志已自动上报</h3>
          <pre>
            <code>{this.state.error?.toString()}</code>
            <code>{this.state.info?.componentStack}</code>
          </pre>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <IconButton
              icon={<ResetIcon />}
              text="清空所有数据"
              onClick={async () => {
                if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
                  this.clearAndSaveData();
                }
              }}
              bordered
            />
          </div>
        </div>
      );
    }
    // if no error occurred, render children
    return this.props.children;
  }
}
