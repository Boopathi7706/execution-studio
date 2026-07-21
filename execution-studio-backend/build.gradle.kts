plugins {
    java
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
    // Backend imports the shared model module
    implementation(project(":execution-studio-trace-model"))
}
