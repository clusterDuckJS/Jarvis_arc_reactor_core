#pragma once

#include <Arduino.h>

class BatteryMonitor {
 public:
  explicit BatteryMonitor(uint8_t adcPin);

  void begin();
  bool poll(uint32_t nowMs);
  bool hasReading() const;
  float batteryVoltage() const;

 private:
  void startSampling(uint32_t nowMs);
  float convertMilliVoltsToAdcVolts(uint32_t averagedMilliVolts) const;
  float convertRawToAdcVoltsFallback(uint16_t averagedRaw) const;

  uint8_t pin;
  bool sampling = false;
  bool readingReady = false;
  uint8_t sampleCount = 0;
  uint32_t milliVoltAccumulator = 0;
  uint32_t lastCompletedMs = 0;
  float latestBatteryVoltage = 0.0f;
};
