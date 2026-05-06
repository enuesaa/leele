#include "ui.hpp"

namespace ui {

    Button::Button(int x, int y, int w, int h, const char *label) : x(x), y(y), w(w), h(h), label(label), recording(false) {}

    void Button::draw() const {
        uint32_t color = recording ? RED : BLUE;

        M5.Display.fillRect(x, y, w, h, color);
        M5.Display.drawRect(x, y, w, h, WHITE);
        M5.Display.setTextDatum(middle_center);
        M5.Display.setTextColor(WHITE);
        M5.Display.drawString(label, x + w / 2, y + h / 2);
    }

    void Button::setRecording(bool is) {
        recording = is;
        draw();
    }

    bool Button::contains(int tx, int ty) const { return (tx >= x && tx <= x + w && ty >= y && ty <= y + h); }

    StatusArea::StatusArea(int x, int y, int w, int h) : x(x), y(y), w(w), h(h) {}

    void StatusArea::setText(const char *t) {
        text = t;
        draw();
    }

    void StatusArea::draw() const {
        M5.Display.fillRect(x, y, w, h, BLACK);
        M5.Display.drawRect(x, y, w, h, WHITE);
        M5.Display.setTextDatum(middle_center);
        M5.Display.setTextColor(WHITE);
        M5.Display.drawString(text, x + w / 2, y + h / 2);
    }

} // namespace ui
