#pragma once

#include <M5Unified.h>

namespace ui {

    class Button {
    public:
        int x, y, w, h;
        String label;
        bool recording;

        Button(int x, int y, int w, int h, const char *label);

        void draw() const;
        void setRecording(bool is);
        bool contains(int tx, int ty) const;
    };

    class StatusArea {
    public:
        int x, y, w, h;
        String text;

        StatusArea(int x, int y, int w, int h);

        void setText(const char *t);
        void draw() const;
    };

} // namespace ui