#include "audioout.hpp"
#include "audioin.hpp"
#include "ui.hpp"
#include "vars.hpp"
#include "network.hpp"
#include <M5Unified.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ===== UI =====
ui::Button btn(100, 80, 120, 60, "OK");
ui::StatusArea status(20, 160, 280, 60);

// ===== MQTT =====
WiFiClientSecure net;
PubSubClient mqtt(net);

void setup() {
    M5.begin();
    M5.Lcd.setTextSize(3);
    btn.draw();
    status.setText("Initializing..");

    if (!network::connectWiFi()) {
        status.setText("WiFi failed");
        return;
    }
    if (!network::connectMQTT(net, mqtt)) {
        status.setText("MQTT failed");
        return;
    }
    mqtt.setCallback(audioout::callback);
    btn.draw();
    status.setText("Ready");
}

void loop() {
    M5.update();
    if (!mqtt.connected()) {
        status.setText("MQTT disconnected");
    }
    mqtt.loop();

    auto t = M5.Touch.getDetail();

    if (t.wasPressed() && btn.contains(t.x, t.y)) {
        audioout::end(mqtt);
        auto msid = audioin::begin();
        audioout::setMsid(msid);
        btn.setRecording(true);
        status.setText("Recording...");
    }

    if (btn.recording) {
        audioin::record(mqtt);
    }

    if (t.wasReleased() && btn.recording) {
        status.setText("Published");
        audioin::end(mqtt);
        btn.setRecording(false);

        M5.delay(2000);

        audioout::begin(mqtt);
        status.setText("Listening..");
    }
}
