FROM node:12-alpine
RUN apk add  --no-cache ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json 
# AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If you are building your code for production
# RUN npm ci --only=production
RUN npm install --only=production

# Bundle app source
COPY ./javascript .
COPY ./frontend ./frontend

EXPOSE 8080
ENV NODE_ENV=live
CMD [ "node", "server.js" ]
