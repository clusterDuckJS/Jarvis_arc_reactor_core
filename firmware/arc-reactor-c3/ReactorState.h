#pragma once

#include <Arduino.h>
#include <ArduinoJson.h>

struct ReactorEffects {
  bool breathing;
  bool livingPlasma;
  bool rotatingPlasma;
  bool energySurge;
  bool electricalFlicker;
  bool colorShift;
  bool heartbeat;
  bool deepSleep;
  bool autoWake;
};

struct ReactorColor {
  uint8_t r;
  uint8_t g;
  uint8_t b;
};

struct ReactorDiagnostics {
  float batteryPercent;
  float voltage;
  float estimatedRuntimeMinutes;
  float powerDrawWatts;
  int signalDbm;
  float signalStrength;
  float temperatureC;
  float powerOutput;
  float plasmaStability;
  float magneticContainment;
  float latencyMs;
  float fps;
  float noiseValue;
  float fieldRotation;
};

struct ReactorState {
  bool power;
  uint8_t brightness;
  char mode[20];
  uint8_t speed;
  ReactorColor color;
  ReactorEffects effects;
  ReactorDiagnostics diagnostics;
  uint32_t lastCommandMs;
};

extern const char *FIRMWARE_VERSION;
extern const char *HARDWARE_VERSION;

void initReactorState();
ReactorState copyReactorState();
void writeReactorState(const ReactorState &nextState);
void updateReactorStateFromJson(JsonVariantConst root);
void updateTouchPower(bool powered);
void updateRuntimeDiagnostics(uint32_t nowMs);
void writeStatusJson(JsonDocument &doc, const ReactorState &state, const char *ackRequestId = nullptr);
