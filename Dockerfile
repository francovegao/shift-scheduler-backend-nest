# Dockerfile
# Use a build stage to generate the client
FROM node:24-alpine AS development
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .

# Pass a dummy DATABASE_URL so prisma generate doesn't crash
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
#RUN npx prisma generate --schema=./prisma/schema.prisma

RUN npm run build

#RUN ls -la dist/

# Use a production stage
FROM node:24-alpine AS production
WORKDIR /app
COPY --from=development /app/package*.json ./
COPY --from=development /app/node_modules ./node_modules
COPY --from=development /app/dist ./dist
COPY --from=development /app/prisma ./prisma
#COPY --from=development /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=development /app/generated/prisma ./generated/prisma
# Ensure the generated client is also copied if it's in a custom location, e.g.,
# COPY --from=development /app/node_modules/.prisma ./node_modules/.prisma 

USER node

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
#CMD ["node", "dist/src/main.js"]

#OLD VERSION
#FROM node:20-alpine
#WORKDIR /app
#COPY package*.json ./
#RUN npm ci
#COPY . .
#EXPOSE 5001
#RUN npm run build
#CMD ["node", "dist/main.js"]

