#include "audioin.hpp"

namespace audioin {

#include "base64.hpp"

static int16_t rec_buffer[512];
int seq = 0;
char msid[11];

void genMsid(char *out) {
    const char charset[] = "abcdefghijklmnopqrstuvwxyz0123456789";
    size_t charset_len = sizeof(charset) - 1;

    for (size_t i = 0; i < 10; i++) {
        out[i] = charset[esp_random() % charset_len];
    }
    out[10] = '\0';
}

const char* begin() {
    seq = 0;
    genMsid(msid);
    M5.Mic.begin();
    return msid;
}

bool publishAudioChunkMessage(PubSubClient& mqtt, const char *id, int seq, unsigned char* data) {
    char payload[1600];
    snprintf(payload, sizeof(payload), "{\"seq\":%d,\"msid\":\"%s\",\"data\":\"%s\",\"ain\":true}", seq, id, data);
    return mqtt.publish("$aws/rules/leele_audioin_chunk/leele/d/m5cores3/audioin/chunk", payload);
}

bool publishAudioEndMessage(PubSubClient& mqtt, const char *id) {
    char end_payload[64];
    snprintf(end_payload, sizeof(end_payload), "{\"msid\":\"%s\",\"ain\":true}", id);
    return mqtt.publish("$aws/rules/leele_audioin_end/leele/d/m5cores3/audioin/end", end_payload);
}

void record(PubSubClient& mqtt) {
    M5.Mic.record(rec_buffer, 512, 16000);
    while (M5.Mic.isRecording()) {
        M5.delay(1);
    }
    unsigned char b64buf[1500];
    unsigned int out_len = encode_base64((uint8_t*)rec_buffer, 512 * 2, b64buf);
    b64buf[out_len] = '\0';
    publishAudioChunkMessage(mqtt, msid, seq, b64buf);
    seq++;
}

void end(PubSubClient& mqtt) {
    publishAudioEndMessage(mqtt, msid);
    M5.Mic.end();
}

}; // namespace audioin
