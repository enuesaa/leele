#include "network.hpp"
#include "vars.hpp"

namespace network {
    bool connectWiFi() {
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        for (int i = 0; i < 10; ++i) {
            if (WiFi.status() == WL_CONNECTED) {
                return true;
            }
            M5.delay(1000);
        }
        return false;
    };

    bool connectMQTT(WiFiClientSecure& net, PubSubClient& mqtt) {
        net.setCACert(AWSIOT_ROOT_CA);
        net.setCertificate(AWSIOT_CERTIFICATE);
        net.setPrivateKey(AWSIOT_PRIVATE_KEY);
        mqtt.setServer(AWSIOT_ENDPOINT, 8883);
        mqtt.setBufferSize(2048);

        while (!mqtt.connected()) {
            if (!mqtt.connect(AWSIOT_THING_ID)) {
                M5.delay(1000);
            }
        }
        for (int i = 0; i < 5; ++i) {
            if (mqtt.connected()) {
                return true;
            }
            if (!mqtt.connect(AWSIOT_THING_ID)) {
                M5.delay(500);
            }
        }
        return false;
    }
}; // namespace network
