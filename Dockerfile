FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./ 
RUN npm ci || npm install
COPY . .
CMD ["npm", "run", "local"]