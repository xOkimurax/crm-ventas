# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build args para Vite (se incrustan en el bundle)
ARG VITE_INSFORGE_URL
ARG VITE_INSFORGE_KEY
ARG VITE_EVO_URL
ARG VITE_EVO_APIKEY
ARG VITE_EVO_INSTANCE

ENV VITE_INSFORGE_URL=$VITE_INSFORGE_URL
ENV VITE_INSFORGE_KEY=$VITE_INSFORGE_KEY
ENV VITE_EVO_URL=$VITE_EVO_URL
ENV VITE_EVO_APIKEY=$VITE_EVO_APIKEY
ENV VITE_EVO_INSTANCE=$VITE_EVO_INSTANCE

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
