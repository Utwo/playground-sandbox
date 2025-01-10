FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add git

EXPOSE 8888
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM build AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM build AS development
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY --chown=node . .
CMD ["pnpm", "run", "dev"]

FROM build AS production
COPY --from=prod-deps --chown=node /app/node_modules /app/node_modules
COPY --chown=node . .
# USER node
CMD ["node", "--experimental-strip-types", "."]
