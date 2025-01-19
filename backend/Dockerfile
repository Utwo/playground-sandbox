FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add git

EXPOSE 8888
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
COPY --chown=node . .

FROM build AS development
CMD ["pnpm", "run", "dev"]

FROM build AS production
# USER node
CMD ["node", "--enable-source-maps", "--import=./src/instrumentation.ts", "--experimental-strip-types", "."]
