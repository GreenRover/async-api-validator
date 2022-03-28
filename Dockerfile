FROM node:16.13

ARG ARTIFACTORY_USER
ARG ARTIFACTORY_PW
ARG VERSION

WORKDIR /usr/src/app

# Download sources from Repository
ADD https://${ARTIFACTORY_USER}:${ARTIFACTORY_PW}@bin.sbb.ch/artifactory/api/npm/tms.npm/api-validator/-/api-validator-${VERSION}.tgz app.tar.gz

# Extract and move to nginx html folder
RUN tar -xzf app.tar.gz --strip-components=1 -C /usr/src/app
RUN npm ci

ENV NODE_ENV docker


EXPOSE 8060

CMD [ "npm", "run", "start:prod" ]