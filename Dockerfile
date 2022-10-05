FROM node:10-slim

# Install app dependencies.
COPY package.json /src/package.json
WORKDIR /src
RUN npm install

# Bundle app source.
COPY app.js /src
EXPOSE 8080
CMD ["node", "app"]