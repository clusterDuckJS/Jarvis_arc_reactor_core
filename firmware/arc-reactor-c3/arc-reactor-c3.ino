#include "BleReactorTransport.h"
#include "ReactorAnimationEngine.h"
#include "ReactorState.h"

static const uint8_t LED_PIN = 2;
static const uint8_t TOUCH_PIN = 4;
static const uint16_t LED_COUNT = 16;
static const uint32_t DIAGNOSTICS_INTERVAL_MS = 500;
static const uint32_t TOUCH_DEBOUNCE_MS = 280;

BleReactorTransport bleTransport;
ReactorAnimationEngine animationEngine(LED_PIN, LED_COUNT);

static uint32_t lastDiagnosticsMs = 0;
static uint32_t lastTouchMs = 0;
static bool previousTouch = false;

void setup() {
  pinMode(TOUCH_PIN, INPUT);
  Serial.begin(115200);
  initReactorState();
  animationEngine.begin();
  bleTransport.begin();
  Serial.println("Arc Reactor BLE firmware online.");
}

void loop() {
  const uint32_t nowMs = millis();

  if (nowMs - lastDiagnosticsMs >= DIAGNOSTICS_INTERVAL_MS) {
    updateRuntimeDiagnostics(nowMs);
    lastDiagnosticsMs = nowMs;
  }

  const bool touched = digitalRead(TOUCH_PIN) == HIGH;
  if (touched && !previousTouch && nowMs - lastTouchMs > TOUCH_DEBOUNCE_MS) {
    ReactorState current = copyReactorState();
    updateTouchPower(!current.power);
    bleTransport.notifyStatus();
    lastTouchMs = nowMs;
  }
  previousTouch = touched;

  bleTransport.poll(nowMs);
  animationEngine.render(nowMs, copyReactorState());
  delay(8);
}
