#pragma once

#include <PubSubClient.h>
#include <M5Unified.h>
#include <ArduinoJson.h>

namespace audioout {
    void begin(PubSubClient& mqtt);
    void setMsid(const char* msid);
    void callback(char* topic, byte* payload, unsigned int length);
    void end(PubSubClient& mqtt);
}
