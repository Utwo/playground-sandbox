FROM node:17-alpine AS build

RUN apk add git

WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install

# Bundle app source
COPY . .

# USER node

EXPOSE 8888
CMD ["npm", "run", "dev"]
