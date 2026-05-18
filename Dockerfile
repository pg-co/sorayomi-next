FROM node:22-alpine AS build

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY codegen.ts components.json index.html schema.graphql ./
COPY tsconfig.app.json tsconfig.json tsconfig.node.json vite.config.ts ./
COPY public ./public
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:1.27-alpine AS runtime

ENV SUWAYOMI_URL=http://localhost:4567

COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
