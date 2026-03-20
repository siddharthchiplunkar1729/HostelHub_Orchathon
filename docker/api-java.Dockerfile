FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /workspace

# Copy only pom.xml first to leverage Docker cache for dependencies
COPY apps/api-java/pom.xml apps/api-java/pom.xml
WORKDIR /workspace/apps/api-java
RUN mvn dependency:go-offline -B

# Copy source and build
COPY apps/api-java/src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring spring

# Match the expected jar name more reliably
COPY --from=build /workspace/apps/api-java/target/*.jar app.jar
COPY docker/api-java-entrypoint.sh /app/entrypoint.sh

RUN chmod 755 /app/entrypoint.sh

USER spring:spring

EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
