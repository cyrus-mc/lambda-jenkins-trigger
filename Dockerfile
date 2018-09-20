###############
#### Build ####
###############
FROM node:8.11.1-slim AS build

# install required tools
RUN apt-get update && \
    apt-get -y install zip && \
    apt-get clean

# copy in package.json only so we can cache dependencies
COPY package.json src/

WORKDIR ./src

# install npm modules
RUN npm install --verbose

# copy in the rest of the source
COPY . .

# build/transpile
RUN npm run transpile


##############
#### TEST ####
##############
FROM build AS test

# build arg used to invalidate cache so tests will run
ARG TIMESTAMP

# run our unit tests
RUN npm run test


################
#### Deploy ####
################
FROM test AS deploy

# package the lambda up into "lambda.zip"
RUN npm run package
