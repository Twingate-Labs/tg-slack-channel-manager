FROM node:16

# Install app dependencies.
COPY package.json /src/package.json
WORKDIR /src
RUN npm install

# Bundle app source.
COPY app.js /src
CMD ["node", "app"]