FROM dockerio.docker.bin.sbb.ch/library/node:16.13

ARG VERSION

WORKDIR /usr/src/app

COPY ./ ./
RUN npm ci ; npm run build

ENV NODE_ENV docker


EXPOSE 8060

CMD [ "npm", "run", "start:prod" ]
