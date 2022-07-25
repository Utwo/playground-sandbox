FROM node:18-alpine AS build

WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn install

EXPOSE 80
COPY --chown=node . .

FROM build AS development

CMD ["npm", "run", "dev", "--", "--port", "80", "--host"]


FROM build AS stage

RUN yarn build


FROM nginx:stable-alpine as production

COPY --from=stage /app/dist/ /usr/share/nginx/html 
