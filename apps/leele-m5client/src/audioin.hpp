#pragma once

#include <PubSubClient.h>
#include <M5Unified.h>
#include <ArduinoJson.h>

namespace audioin {
    const char* begin();
    void record(PubSubClient& mqtt);
    void end(PubSubClient& mqtt);
}
