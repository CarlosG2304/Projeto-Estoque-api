FROM node:latest 
WORKDIR /app
ADD . .
RUN npm install
RUN npm install pm2 -g
EXPOSE 3000
CMD ["pm2-runtime", "api.js"]