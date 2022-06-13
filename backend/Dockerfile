FROM node:17-alpine AS build

RUN apk add git

WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn install

EXPOSE 8888
COPY . .

FROM build AS development

CMD ["npm", "run", "dev"]


FROM build AS production

RUN yarn build

USER node

CMD ["node", "."]
