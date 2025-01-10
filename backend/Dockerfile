FROM node:22-alpine AS build

RUN corepack enable
RUN apk add git

WORKDIR /app

# Install app dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

EXPOSE 8888
COPY --chown=node . .

FROM build AS development

CMD ["pnpm", "run", "dev"]


FROM build AS production

RUN pnpm build

# USER node

CMD ["node", "."]
