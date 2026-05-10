#include "audioout.hpp"

namespace audioout {

#include "base64.hpp"

typedef struct {
    int16_t data[1024];
    size_t len;
} AudioChunk;

QueueHandle_t audioQueue;
volatile bool isPlaying = false;
char currentMsid[11];

void callback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;

    if (deserializeJson(doc, payload, length)) return;

    if (doc["msid"].is<const char*>() and doc["data"].is<const char*>()) {
        const char* msid = doc["msid"];
        if (strcmp(msid, currentMsid) != 0) {
            return;
        }
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

void begin(PubSubClient& mqtt) {
    M5.Speaker.setVolume(130);
    M5.Speaker.begin();
    audioQueue = xQueueCreate(60, sizeof(AudioChunk));
    xTaskCreatePinnedToCore(audioTask, "audio", 8192, NULL, 2, NULL, 1);
    mqtt.subscribe("leele/d/m5cores3/audioout/chunk");
}

void setMsid(const char* msid) {
    memcpy(currentMsid, msid, 11);
}

void end(PubSubClient& mqtt) {
    M5.Speaker.end();
    mqtt.unsubscribe("leele/d/m5cores3/audioout/chunk");
}

}; // namespace audioout
