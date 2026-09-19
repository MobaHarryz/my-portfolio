# One image for the whole app: Angular is built, then served by Spring Boot next to the API.

# 1) Front end
FROM node:24-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx ng build --configuration production

# 2) Back end (with the front end bundled as static resources)
FROM eclipse-temurin:25-jdk AS api
WORKDIR /api
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY backend/src src
COPY --from=web /web/dist/frontend/browser src/main/resources/static
RUN ./mvnw -q -B package -DskipTests

# 3) Runtime
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --uid 1001 app
COPY --from=api /api/target/backend-*.jar app.jar
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
