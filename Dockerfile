FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/app/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    python3-pip \
    curl \
    ca-certificates \
    dos2unix \
    openjdk-17-jre-headless \
    parallel \
    moreutils \
    brotli \
    zopfli \
    libxml2-utils \
    yajl-tools \
    qrencode \
    graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

# Удаляем \r из всех файлов
RUN find . -type f -exec sed -i 's/\r$//' {} \; && \
    chmod +x process-static dev-deploy-static generate-* indexnow *.sh

# Устанавливаем зависимости
RUN python3 -m venv /app/venv && \
    . /app/venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    npm ci

# Запускаем сборку
RUN . /app/venv/bin/activate && ./dev-deploy-static

FROM nginx:alpine
COPY --from=builder /app/static-tmp /usr/share/nginx/html
COPY nginx/nginx-dev.conf /etc/nginx/nginx.conf
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]