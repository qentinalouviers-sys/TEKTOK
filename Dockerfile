FROM node:20-alpine

# Install system dependencies: ffmpeg, python3 (for yt-dlp), curl
RUN apk add --no-cache ffmpeg python3 py3-pip curl bash nodejs npm fontconfig ttf-dejavu

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install yt-dlp (latest stable)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Rebuild font cache so ffmpeg drawtext can find DejaVu fonts
RUN fc-cache -f

WORKDIR /app

# Copy package files first for layer caching
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build frontend (Vite) + backend (esbuild/tsc via bun build)
RUN bun run build

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
