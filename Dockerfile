FROM node:latest

# Install app dependencies.
COPY package.json /src/package.json
WORKDIR /src
RUN npm install

# Bundle app source.
COPY app.js.back /src
CMD ["node", "app"]