FROM node:16-alpine

ENV TZ=Asia/Shanghai
EXPOSE 1200

WORKDIR /app
COPY . .
RUN apk add git make gcc g++ libc-dev && \
    npm install

ENTRYPOINT [ "npm","run","start" ]
