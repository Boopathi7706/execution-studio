plugins {
    java
    application
    id("com.github.johnrengelman.shadow")
}

application {
    mainClass.set("com.executionstudio.cli.TraceEngineApp")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Shared Trace Models
    implementation(project(":execution-studio-trace-model"))

    // JSON serialization
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")

    // Logging
    implementation("org.slf4j:slf4j-api:2.0.9")
    runtimeOnly("ch.qos.logback:logback-classic:1.4.11")

    // Testing
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testImplementation("org.assertj:assertj-core:3.24.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
    // Increase timeout for integration tests that launch child JVMs
    systemProperty("junit.jupiter.execution.timeout.default", "60s")
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}

tasks.named<com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar>("shadowJar") {
    archiveBaseName.set("trace-engine")
    archiveClassifier.set("")
    archiveVersion.set("")
    mergeServiceFiles()
    manifest {
        attributes(
            "Main-Class" to "com.executionstudio.cli.TraceEngineApp",
            "Implementation-Version" to project.version
        )
    }
}

// Ensure shadow JAR is built when running 'gradle build'
tasks.build {
    dependsOn(tasks.named("shadowJar"))
}
