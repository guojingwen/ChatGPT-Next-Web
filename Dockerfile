FROM  node:20-alpine

# 替换为中国大陆的镜像源
RUN echo http://mirrors.ustc.edu.cn/alpine/v3.12/main > /etc/apk/repositories; \
    echo http://mirrors.ustc.edu.cn/alpine/v3.12/community >> /etc/apk/repositories
# 更新软件包索引
RUN apk update
# 安装 tzdata 包
RUN apk add --no-cache tzdata
# 设置时区
ENV TZ=Asia/Shanghai

WORKDIR /usr/ai_teacher

#RUN npm config set registry https://registry.npm.taobao.org/
#RUN npm i -g next@14.0.4 http-server
COPY ./ /usr/ai_teacher/
EXPOSE 3002

ENTRYPOINT ["npm", "start"]
