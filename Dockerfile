FROM node:16.13

ARG ARTIFACTORY_USER
ARG ARTIFACTORY_PW
ARG VERSION

WORKDIR /usr/src/app

COPY ./ ./
RUN npm ci ; npm run build

ENV NODE_ENV docker


EXPOSE 8060

CMD [ "npm", "run", "start:prod" ]