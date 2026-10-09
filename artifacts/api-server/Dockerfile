FROM node:22-bookworm-slim

WORKDIR /app
COPY . .

RUN npm ci --no-audit --no-fund \
    && npm --workspace=@workspace/api-server run build

EXPOSE 8080

# Schema creation and the vocabulary import are safe to repeat on restart.
CMD ["sh", "-c", "npm --workspace=@workspace/db run push && npm --workspace=@workspace/db run seed && npm --workspace=@workspace/api-server run start"]
