FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY . .

RUN npm ci --no-audit --no-fund \
    && npm --workspace=@workspace/ssc-vocab run build

FROM nginx:stable-alpine

COPY artifacts/ssc-vocab/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/artifacts/ssc-vocab/dist/public /usr/share/nginx/html

EXPOSE 80
