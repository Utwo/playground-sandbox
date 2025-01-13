FROM denoland/deno:alpine-2.1.5 AS build

RUN apk add git

EXPOSE 8888
WORKDIR /app
COPY package.json deno.lock ./
RUN deno install
COPY . .

FROM build AS development
CMD ["deno", "task", "dev"]

FROM build AS production
RUN deno cache src/server.ts
CMD ["deno", "run", "--unsafely-ignore-certificate-errors", "--allow-env", "--allow-read", "--allow-sys", "--allow-net", "src/server.ts"]
