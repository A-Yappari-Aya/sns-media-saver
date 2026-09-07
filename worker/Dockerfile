# Worker image: Node + yt-dlp + ffmpeg
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl ffmpeg python3 \
    && rm -rf /var/lib/apt/lists/*
RUN curl -L -o /usr/local/bin/yt-dlp \
    https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod a+x /usr/local/bin/yt-dlp
WORKDIR /app
COPY package.json ./
COPY src ./src
ENV NODE_ENV=production
ENV PORT=4100
ENV YT_DLP_PATH=yt-dlp
EXPOSE 4100
CMD ["node", "src/index.js"]
