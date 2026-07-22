package com.executionstudio.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Externalized configuration properties for Execution Studio Backend.
 * Mapped to the prefix "execution-studio" in application.yml.
 */
@Component
@ConfigurationProperties(prefix = "execution-studio")
public class BackendProperties {

    private String tempDirectory = System.getProperty("java.io.tmpdir") + "/execution-studio";
    private String uploadDirectory = System.getProperty("java.io.tmpdir") + "/execution-studio/uploads";
    private int timeoutSeconds = 10;
    private int objectDepth = 5;
    private int stepLimit = 1000;
    private SerializerOptions serializer = new SerializerOptions();

    public String getTempDirectory() {
        return tempDirectory;
    }

    public void setTempDirectory(String tempDirectory) {
        this.tempDirectory = tempDirectory;
    }

    public String getUploadDirectory() {
        return uploadDirectory;
    }

    public void setUploadDirectory(String uploadDirectory) {
        this.uploadDirectory = uploadDirectory;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public int getObjectDepth() {
        return objectDepth;
    }

    public void setObjectDepth(int objectDepth) {
        this.objectDepth = objectDepth;
    }

    public int getStepLimit() {
        return stepLimit;
    }

    public void setStepLimit(int stepLimit) {
        this.stepLimit = stepLimit;
    }

    public SerializerOptions getSerializer() {
        return serializer;
    }

    public void setSerializer(SerializerOptions serializer) {
        this.serializer = serializer;
    }

    public static class SerializerOptions {
        private boolean prettyPrint = true;
        private boolean includeNulls = false;

        public boolean isPrettyPrint() {
            return prettyPrint;
        }

        public void setPrettyPrint(boolean prettyPrint) {
            this.prettyPrint = prettyPrint;
        }

        public boolean isIncludeNulls() {
            return includeNulls;
        }

        public void setIncludeNulls(boolean includeNulls) {
            this.includeNulls = includeNulls;
        }
    }
}
