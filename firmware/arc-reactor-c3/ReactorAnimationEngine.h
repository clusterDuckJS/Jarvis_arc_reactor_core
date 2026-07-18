#pragma once

#include <Adafruit_NeoPixel.h>
#include "ReactorState.h"

class ReactorAnimationEngine {
 public:
  ReactorAnimationEngine(uint8_t pin, uint16_t ledCount);
  void begin();
  void render(uint32_t nowMs, const ReactorState &state);

 private:
  Adafruit_NeoPixel pixels;
  uint32_t wheelColor(float phase, float scale, const ReactorState &state) const;
  uint8_t scaleChannel(uint8_t channel, float scale) const;
};
