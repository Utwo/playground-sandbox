FROM node:22-alpine AS build

RUN corepack enable
WORKDIR /app

# Install app dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

EXPOSE 80
COPY --chown=node . .

FROM build AS development

CMD ["pnpm", "run", "dev", "--port", "80", "--host"]


FROM build AS stage

RUN pnpm build


FROM nginx:stable-alpine AS production

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=stage /app/dist/ /usr/share/nginx/html
