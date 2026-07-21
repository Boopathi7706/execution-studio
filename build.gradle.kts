plugins {
    // Avoid applying plugins to the root project, just declare common plugins if needed
    id("com.github.johnrengelman.shadow") version "8.1.1" apply false
}

allprojects {
    group = "com.executionstudio"
    version = "0.1.0"
}
