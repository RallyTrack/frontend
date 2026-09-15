FROM node:22-alpine AS builder
WORKDIR /app
# lockfile 기준 재현 가능한 설치 (react가 optional peerDep이라 npm install은 누락 위험)
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Nginx로 정적 파일 서빙
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# Git checkouts under umask 027 can leave public assets unreadable to nginx.
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} +
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
