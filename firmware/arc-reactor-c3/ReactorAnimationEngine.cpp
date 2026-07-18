#include "ReactorAnimationEngine.h"

ReactorAnimationEngine::ReactorAnimationEngine(uint8_t pin, uint16_t ledCount)
    : pixels(ledCount, pin, NEO_GRB + NEO_KHZ800) {}

void ReactorAnimationEngine::begin() {
  pixels.begin();
  pixels.clear();
  pixels.show();
}

uint8_t ReactorAnimationEngine::scaleChannel(uint8_t channel, float scale) const {
  const int value = static_cast<int>(channel * scale);
  if (value < 0) {
    return 0;
  }
  if (value > 255) {
    return 255;
  }
  return static_cast<uint8_t>(value);
}

uint32_t ReactorAnimationEngine::wheelColor(float phase, float scale, const ReactorState &state) const {
  const float shifted = fmodf(phase, 1.0f);
  const float r = 0.5f + 0.5f * sinf(TWO_PI * shifted);
  const float g = 0.5f + 0.5f * sinf(TWO_PI * (shifted + 0.33f));
  const float b = 0.5f + 0.5f * sinf(TWO_PI * (shifted + 0.66f));

  return pixels.Color(
    scaleChannel(state.color.r, scale * (0.55f + r * 0.45f)),
    scaleChannel(state.color.g, scale * (0.55f + g * 0.45f)),
    scaleChannel(state.color.b, scale * (0.55f + b * 0.45f)));
}

void ReactorAnimationEngine::render(uint32_t nowMs, const ReactorState &state) {
  if (state.effects.deepSleep || !state.power) {
    pixels.clear();
    pixels.show();
    return;
  }

  const float time = nowMs / 1000.0f;
  const float speed = 0.18f + state.speed / 180.0f;
  const float breathe = state.effects.breathing ? 0.68f + 0.32f * sinf(time * speed) : 1.0f;
  const float surge = state.effects.energySurge ? 0.85f + 0.15f * sinf(time * 8.0f) : 1.0f;
  const float animationScale = breathe * surge;
  const float rotation = state.effects.rotatingPlasma ? time * speed : 0.0f;

  pixels.setBrightness(state.brightness);

  for (uint16_t index = 0; index < pixels.numPixels(); index++) {
    const float position = static_cast<float>(index) / static_cast<float>(pixels.numPixels());
    const float wave = 0.58f + 0.42f * sinf(TWO_PI * (position + rotation));
    const float plasma = state.effects.livingPlasma ? 0.78f + 0.22f * sinf(time * 3.1f + index * 1.7f) : 1.0f;
    const float flicker =
      state.effects.electricalFlicker ? 0.92f + 0.08f * sinf(time * 23.0f + index * 5.0f) : 1.0f;
    const float heartbeat =
      state.effects.heartbeat ? 0.8f + 0.2f * powf(fmaxf(0.0f, sinf(time * 4.5f)), 6.0f) : 1.0f;
    const float scale = animationScale * wave * plasma * flicker * heartbeat;

    if (state.effects.colorShift) {
      pixels.setPixelColor(index, wheelColor(position + rotation + time * 0.08f, scale, state));
    } else {
      pixels.setPixelColor(index,
        pixels.Color(
          scaleChannel(state.color.r, scale),
          scaleChannel(state.color.g, scale),
          scaleChannel(state.color.b, scale)));
    }
  }

  pixels.show();
}
