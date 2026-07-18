#include "ReactorState.h"

const char *FIRMWARE_VERSION = "1.0.1-c3-json";
const char *HARDWARE_VERSION = "ESP32-C3 / WS2812B-16 / TTP223";

static ReactorState reactorState;
static portMUX_TYPE reactorMux = portMUX_INITIALIZER_UNLOCKED;

static uint8_t clampByte(int value) {
  if (value < 0) {
    return 0;
  }
  if (value > 255) {
    return 255;
  }
  return static_cast<uint8_t>(value);
}

static float clampFloat(float value, float minValue, float maxValue) {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
}

static void copyMode(char *target, const char *mode) {
  strlcpy(target, mode == nullptr || strlen(mode) == 0 ? "mark-iii" : mode, 20);
}

static bool mergeBool(JsonVariantConst value, bool fallback) {
  return value.is<bool>() ? value.as<bool>() : fallback;
}

static ReactorEffects defaultEffects() {
  return {
    true,
    true,
    true,
    false,
    true,
    false,
    false,
    false,
    true,
  };
}

void initReactorState() {
  ReactorState initial = {};
  initial.power = true;
  initial.brightness = 192;
  copyMode(initial.mode, "mark-iii");
  initial.speed = 144;
  initial.color = {97, 232, 255};
  initial.effects = defaultEffects();
  initial.diagnostics = {
    84.0f,
    3.86f,
    124.0f,
    1.42f,
    -48,
    82.0f,
    34.2f,
    72.0f,
    94.0f,
    91.0f,
    0.0f,
    60.0f,
    0.28f,
    0.0f,
  };
  initial.lastCommandMs = millis();
  writeReactorState(initial);
}

ReactorState copyReactorState() {
  portENTER_CRITICAL(&reactorMux);
  ReactorState snapshot = reactorState;
  portEXIT_CRITICAL(&reactorMux);
  return snapshot;
}

void writeReactorState(const ReactorState &nextState) {
  portENTER_CRITICAL(&reactorMux);
  reactorState = nextState;
  portEXIT_CRITICAL(&reactorMux);
}

static void mergeEffects(JsonVariantConst effects, ReactorState &state) {
  if (effects.isNull()) {
    return;
  }

  state.effects.breathing = mergeBool(effects["breathing"], state.effects.breathing);
  state.effects.livingPlasma = mergeBool(effects["livingPlasma"], state.effects.livingPlasma);
  state.effects.rotatingPlasma = mergeBool(effects["rotatingPlasma"], state.effects.rotatingPlasma);
  state.effects.energySurge = mergeBool(effects["energySurge"], state.effects.energySurge);
  state.effects.electricalFlicker = mergeBool(effects["electricalFlicker"], state.effects.electricalFlicker);
  state.effects.colorShift = mergeBool(effects["colorShift"], state.effects.colorShift);
  state.effects.heartbeat = mergeBool(effects["heartbeat"], state.effects.heartbeat);
  state.effects.deepSleep = mergeBool(effects["deepSleep"], state.effects.deepSleep);
  state.effects.autoWake = mergeBool(effects["autoWake"], state.effects.autoWake);
}

static void mergeCommandState(JsonVariantConst stateJson, ReactorState &state) {
  if (stateJson.isNull()) {
    return;
  }

  state.power = mergeBool(stateJson["power"], state.power);
  state.brightness = clampByte(stateJson["brightness"] | state.brightness);
  state.speed = clampByte(stateJson["speed"] | state.speed);

  const char *mode = stateJson["mode"] | nullptr;
  if (mode != nullptr) {
    copyMode(state.mode, mode);
  }

  JsonVariantConst color = stateJson["color"];
  if (!color.isNull()) {
    state.color.r = clampByte(color["r"] | state.color.r);
    state.color.g = clampByte(color["g"] | state.color.g);
    state.color.b = clampByte(color["b"] | state.color.b);
  }

  mergeEffects(stateJson["effects"], state);
}

void updateReactorStateFromJson(JsonVariantConst root) {
  ReactorState next = copyReactorState();
  const char *command = root["command"] | "";

  mergeCommandState(root["state"], next);

  if (strcmp(command, "POWER_ON") == 0 || strcmp(command, "WAKE") == 0) {
    next.power = true;
    next.effects.deepSleep = false;
  } else if (strcmp(command, "POWER_OFF") == 0) {
    next.power = false;
  } else if (strcmp(command, "SLEEP") == 0) {
    next.power = false;
    next.effects.deepSleep = true;
  }

  next.lastCommandMs = millis();
  portENTER_CRITICAL(&reactorMux);
  next.diagnostics = reactorState.diagnostics;
  reactorState = next;
  portEXIT_CRITICAL(&reactorMux);
}

void updateTouchPower(bool powered) {
  const uint32_t nowMs = millis();

  portENTER_CRITICAL(&reactorMux);
  reactorState.power = powered;
  if (powered) {
    reactorState.effects.deepSleep = false;
  }
  reactorState.lastCommandMs = nowMs;
  portEXIT_CRITICAL(&reactorMux);
}

void updateRuntimeDiagnostics(uint32_t nowMs) {
  ReactorState next = copyReactorState();
  const float elapsed = nowMs / 1000.0f;
  const float powerFactor = next.power ? next.brightness / 255.0f : 0.08f;
  const float wave = sinf(elapsed * 0.73f);
  ReactorDiagnostics diagnostics = next.diagnostics;

  diagnostics.voltage = 3.78f + wave * 0.04f - powerFactor * 0.05f;
  diagnostics.batteryPercent = clampFloat(82.0f - powerFactor * 2.8f + wave * 1.2f, 5.0f, 100.0f);
  diagnostics.estimatedRuntimeMinutes = clampFloat(170.0f - powerFactor * 82.0f, 12.0f, 220.0f);
  diagnostics.powerDrawWatts = 0.16f + powerFactor * 1.85f;
  diagnostics.signalDbm = -46;
  diagnostics.signalStrength = 86.0f;
  diagnostics.temperatureC = 30.5f + powerFactor * 9.0f + wave * 1.2f;
  diagnostics.powerOutput = clampFloat(powerFactor * 100.0f, 0.0f, 100.0f);
  diagnostics.plasmaStability = clampFloat(92.0f - fabsf(wave) * 3.2f, 0.0f, 100.0f);
  diagnostics.magneticContainment = clampFloat(94.0f - fabsf(sinf(elapsed * 0.4f)) * 4.0f, 0.0f, 100.0f);
  diagnostics.noiseValue = fabsf(sinf(elapsed * 1.31f));
  diagnostics.fieldRotation = fmodf(elapsed * (0.25f + next.speed / 255.0f), TWO_PI);

  portENTER_CRITICAL(&reactorMux);
  reactorState.diagnostics = diagnostics;
  portEXIT_CRITICAL(&reactorMux);
}

void writeStatusJson(JsonDocument &doc, const ReactorState &state, const char *ackRequestId) {
  doc.clear();
  doc["type"] = "status";
  doc["uptimeMs"] = millis();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["hardwareVersion"] = HARDWARE_VERSION;
  if (ackRequestId != nullptr && strlen(ackRequestId) > 0) {
    doc["ack"] = ackRequestId;
    doc["requestId"] = ackRequestId;
  }

  JsonObject stateJson = doc["state"].to<JsonObject>();
  stateJson["power"] = state.power;
  stateJson["brightness"] = state.brightness;
  stateJson["mode"] = state.mode;
  stateJson["speed"] = state.speed;

  JsonObject color = stateJson["color"].to<JsonObject>();
  color["r"] = state.color.r;
  color["g"] = state.color.g;
  color["b"] = state.color.b;

  JsonObject effects = stateJson["effects"].to<JsonObject>();
  effects["breathing"] = state.effects.breathing;
  effects["livingPlasma"] = state.effects.livingPlasma;
  effects["rotatingPlasma"] = state.effects.rotatingPlasma;
  effects["energySurge"] = state.effects.energySurge;
  effects["electricalFlicker"] = state.effects.electricalFlicker;
  effects["colorShift"] = state.effects.colorShift;
  effects["heartbeat"] = state.effects.heartbeat;
  effects["deepSleep"] = state.effects.deepSleep;
  effects["autoWake"] = state.effects.autoWake;

  JsonObject diagnostics = doc["diagnostics"].to<JsonObject>();
  diagnostics["batteryPercent"] = state.diagnostics.batteryPercent;
  diagnostics["voltage"] = state.diagnostics.voltage;
  diagnostics["estimatedRuntimeMinutes"] = state.diagnostics.estimatedRuntimeMinutes;
  diagnostics["powerDrawWatts"] = state.diagnostics.powerDrawWatts;
  diagnostics["signalDbm"] = state.diagnostics.signalDbm;
  diagnostics["signalStrength"] = state.diagnostics.signalStrength;
  diagnostics["temperatureC"] = state.diagnostics.temperatureC;
  diagnostics["powerOutput"] = state.diagnostics.powerOutput;
  diagnostics["plasmaStability"] = state.diagnostics.plasmaStability;
  diagnostics["magneticContainment"] = state.diagnostics.magneticContainment;
  diagnostics["latencyMs"] = state.diagnostics.latencyMs;
  diagnostics["fps"] = state.diagnostics.fps;
  diagnostics["noiseValue"] = state.diagnostics.noiseValue;
  diagnostics["fieldRotation"] = state.diagnostics.fieldRotation;
}
