FROM dockerio.docker.bin.sbb.ch/library/node:22.3

ARG VERSION

WORKDIR /usr/src/app

COPY ./ ./
RUN npm ci ; npm run build:fast

ENV NODE_ENV docker


EXPOSE 8060

CMD [ "node", "/usr/src/app/dist/src/index.js" ]
