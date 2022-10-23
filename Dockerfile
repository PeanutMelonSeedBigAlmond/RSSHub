FROM node:16-alpine as build

WORKDIR /app
COPY . .
RUN apk add python3 git make gcc g++ libc-dev && \
    npm install

FROM node:16-alpine as production

WORKDIR /app
COPY --from=build /app /app
ENV TZ=Asia/Shanghai
EXPOSE 1200

ENTRYPOINT [ "npm","run","start" ]
