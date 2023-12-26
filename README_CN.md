<div align="center">
<img src="./docs/images/icon.svg" alt="预览"/>

<h1 align="center">ChatGPT Next Web</h1>

一键免费部署你的私人 ChatGPT 网页应用。

[演示 Demo](https://chat-gpt-next-web.vercel.app/) / [反馈 Issues](https://github.com/Yidadaa/ChatGPT-Next-Web/issues) / [加入 Discord](https://discord.gg/zrhvHCr79N) / [QQ 群](https://user-images.githubusercontent.com/16968934/228190818-7dd00845-e9b9-4363-97e5-44c507ac76da.jpeg) / [打赏开发者](https://user-images.githubusercontent.com/16968934/227772541-5bcd52d8-61b7-488c-a203-0330d8006e2b.jpg) / [Donate](#捐赠-donate-usdt)

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Yidadaa/ChatGPT-Next-Web)

![主界面](./docs/images/cover.png)

</div>

## 开始使用

## 保持更新

如果你按照上述步骤一键部署了自己的项目，可能会发现总是提示“存在更新”的问题，这是由于 Vercel 会默认为你创建一个新项目而不是 fork 本项目，这会导致无法正确地检测更新。
推荐你按照下列步骤重新部署：

- 删除掉原先的仓库；
- 使用页面右上角的 fork 按钮，fork 本项目；
- 在 Vercel 重新选择并部署，[请查看详细教程](./docs/vercel-cn.md#如何新建项目)。

### 打开自动更新

> 如果你遇到了 Upstream Sync 执行错误，请手动 Sync Fork 一次！

当你 fork 项目之后，由于 Github 的限制，需要手动去你 fork 后的项目的 Actions 页面启用 Workflows，并启用 Upstream Sync Action，启用之后即可开启每小时定时自动更新：

![自动更新](./docs/images/enable-actions.jpg)

![启用自动更新](./docs/images/enable-actions-sync.jpg)

### 手动更新代码

如果你想让手动立即更新，可以查看 [Github 的文档](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) 了解如何让 fork 的项目与上游代码同步。

你可以 star/watch 本项目或者 follow 作者来及时获得新功能更新通知。

## 环境变量

> 本项目大多数配置项都通过环境变量来设置，教程：[如何修改 Vercel 环境变量](./docs/vercel-cn.md)。

### 本地开发

1. 安装 nodejs 18 和 yarn，具体细节请询问 ChatGPT；
2. 执行 `yarn install && yarn dev` 即可。⚠️ 注意：此命令仅用于本地开发，不要用于部署！
3. 如果你想本地部署，请使用 `yarn install && yarn build && yarn start` 命令，你可以配合 pm2 来守护进程，防止被杀死，详情询问 ChatGPT。

## 部署

### 容器部署 （推荐）

> Docker 版本需要在 20 及其以上，否则会提示找不到镜像。

> ⚠️ 注意：docker 版本在大多数时间都会落后最新的版本 1 到 2 天，所以部署后会持续出现“存在更新”的提示，属于正常现象。

```shell
docker pull yidadaa/chatgpt-next-web

docker run -d -p 3000:3000 \
   yidadaa/chatgpt-next-web
```

你也可以指定 proxy：

```shell
docker run -d -p 3000:3000 \
   --net=host \
   yidadaa/chatgpt-next-web
```

如果你需要指定其他环境变量，请自行在上述命令中增加 `-e 环境变量=环境变量值` 来指定。

### 本地部署

在控制台运行下方命令：

```shell
bash <(curl -s https://raw.githubusercontent.com/Yidadaa/ChatGPT-Next-Web/main/scripts/setup.sh)
```

⚠️ 注意：如果你安装过程中遇到了问题，请使用 docker 部署。

## 鸣谢

### 捐赠者

> 见英文版。

### 贡献者

[见项目贡献者列表](https://github.com/Yidadaa/ChatGPT-Next-Web/graphs/contributors)

### 相关项目

- [one-api](https://github.com/songquanpeng/one-api): 一站式大模型额度管理平台，支持市面上所有主流大语言模型

## 开源协议

[MIT](https://opensource.org/license/mit/)
