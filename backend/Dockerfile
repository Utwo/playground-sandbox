FROM node:16-alpine AS build

WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./

RUN npm ci

# Bundle app source
COPY . .

# Remove packages specified in your devDependencies
RUN npm prune --production

# USER node

CMD ["npm", "start"]
