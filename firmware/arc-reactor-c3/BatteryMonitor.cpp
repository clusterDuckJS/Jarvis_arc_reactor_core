#include "BatteryMonitor.h"

static const uint8_t BATTERY_ADC_RESOLUTION_BITS = 12;
static const uint16_t BATTERY_ADC_MAX_RAW = (1U << BATTERY_ADC_RESOLUTION_BITS) - 1U;
static const uint8_t BATTERY_SAMPLE_COUNT = 32;
static const uint32_t BATTERY_SAMPLE_INTERVAL_MS = 5000;
static const float BATTERY_DIVIDER_MULTIPLIER = 3.183673f;

// Used only if Arduino's calibrated millivolt API is unavailable in a future core.
// Adjust after comparing diagnostics.voltage with a multimeter reading at Battery+.
static const float BATTERY_ADC_FALLBACK_FULL_SCALE_VOLTS = 1.75f;
static const float BATTERY_ADC_FALLBACK_SCALE = 1.0f;

BatteryMonitor::BatteryMonitor(uint8_t adcPin) : pin(adcPin) {}

void BatteryMonitor::begin() {
  pinMode(pin, INPUT);
  analogReadResolution(BATTERY_ADC_RESOLUTION_BITS);
  analogSetPinAttenuation(pin, ADC_6db);
  startSampling(millis());
}

bool BatteryMonitor::poll(uint32_t nowMs) {
  if (!sampling && nowMs - lastCompletedMs >= BATTERY_SAMPLE_INTERVAL_MS) {
    startSampling(nowMs);
  }

  if (!sampling) {
    return false;
  }

  milliVoltAccumulator += analogReadMilliVolts(pin);
  sampleCount++;

  if (sampleCount < BATTERY_SAMPLE_COUNT) {
    return false;
  }

  const uint32_t averagedMilliVolts = milliVoltAccumulator / sampleCount;
  const float adcVolts = convertMilliVoltsToAdcVolts(averagedMilliVolts);
  latestBatteryVoltage = adcVolts * BATTERY_DIVIDER_MULTIPLIER;
  readingReady = true;
  sampling = false;
  lastCompletedMs = nowMs;
  return true;
}

bool BatteryMonitor::hasReading() const {
  return readingReady;
}

float BatteryMonitor::batteryVoltage() const {
  return latestBatteryVoltage;
}

void BatteryMonitor::startSampling(uint32_t nowMs) {
  sampling = true;
  sampleCount = 0;
  milliVoltAccumulator = 0;
  lastCompletedMs = nowMs;
}

float BatteryMonitor::convertMilliVoltsToAdcVolts(uint32_t averagedMilliVolts) const {
  return averagedMilliVolts / 1000.0f;
}

float BatteryMonitor::convertRawToAdcVoltsFallback(uint16_t averagedRaw) const {
  const float normalized = static_cast<float>(averagedRaw) / static_cast<float>(BATTERY_ADC_MAX_RAW);
  return normalized * BATTERY_ADC_FALLBACK_FULL_SCALE_VOLTS * BATTERY_ADC_FALLBACK_SCALE;
}
