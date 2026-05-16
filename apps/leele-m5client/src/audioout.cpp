#include "audioout.hpp"

namespace audioout {

#include "base64.hpp"

typedef struct {
    int16_t data[1024];
    size_t len;
} AudioChunk;

QueueHandle_t audioQueue;
volatile bool isPlaying = false;
char currentTopic[128] = "leele/d/m5cores3/audioout/chunk";

void callback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;
    if (strcmp(topic, currentTopic) != 0) {
        return;
    }
    if (deserializeJson(doc, payload, length)) {
        return;
    }
    if (doc["data"].is<const char*>()) {
        const char* b64 = doc["data"];

        AudioChunk chunk;
        chunk.len = decode_base64((const unsigned char*)b64, strlen(b64), (uint8_t*)chunk.data);

        if (chunk.len > 0) {
            xQueueSend(audioQueue, &chunk, 0);
            isPlaying = true;
        }
    }
}

void audioTask(void* arg) {
    AudioChunk chunk;

    while (true) {
        if (!isPlaying) {
            vTaskDelay(10);
            continue;
        }
        while (M5.Speaker.isPlaying()) {
            vTaskDelay(1);
        }
        if (xQueueReceive(audioQueue, &chunk, 6)) {
            M5.Speaker.playRaw(chunk.data, chunk.len / 2, 16000, false, 1, -1, false);
        }

        if (uxQueueMessagesWaiting(audioQueue) == 0) {
            vTaskDelay(10);
            if (uxQueueMessagesWaiting(audioQueue) == 0) {
                isPlaying = false;
            }
        }
    }
}

void setup() {
    audioQueue = xQueueCreate(60, sizeof(AudioChunk));
    xTaskCreatePinnedToCore(audioTask, "audio", 8192, NULL, 2, NULL, 1);
}

void begin(PubSubClient& mqtt) {
    M5.Speaker.setVolume(130);
    M5.Speaker.begin();
    mqtt.subscribe(currentTopic);
}

void setMi(const char* mi) {
    snprintf(currentTopic, sizeof(currentTopic), "leele/d/m5cores3/audioout/%s/chunk", mi);
}

void end(PubSubClient& mqtt) {
    if (M5.Speaker.isRunning()) {
        M5.Speaker.end();
        isPlaying = false;
        xQueueReset(audioQueue);
        M5.delay(10);
    }
    mqtt.unsubscribe(currentTopic);
}

}; // namespace audioout
