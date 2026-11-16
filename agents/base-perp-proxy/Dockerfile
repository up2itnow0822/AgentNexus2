# node:24.22.3-alpine
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 as base
WORKDIR /app
COPY package.json package-lock.json* .
RUN npm ci || npm install
COPY tsconfig.json .
COPY src ./src
RUN npx tsc -p .
# node:24.22.3-alpine
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5
WORKDIR /app
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./package.json
RUN addgroup -g 1001 -S nodejs && adduser -S agent -u 1001 -G nodejs
USER agent
EXPOSE 8001
CMD ["node","dist/index.js"]