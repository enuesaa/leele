#pragma once

#include <M5Unified.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

namespace network {
    bool connectWiFi();
    bool connectMQTT(WiFiClientSecure& net, PubSubClient& mqtt);
}; // namespace network
