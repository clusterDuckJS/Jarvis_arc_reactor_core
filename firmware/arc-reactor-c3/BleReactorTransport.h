#pragma once

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "ReactorState.h"

class BleReactorTransport {
 public:
  void begin();
  void poll(uint32_t nowMs);
  bool isConnected() const;
  void notifyStatus(const char *ackRequestId = nullptr);

 private:
  BLEServer *server = nullptr;
  BLEService *service = nullptr;
  BLECharacteristic *commandCharacteristic = nullptr;
  BLECharacteristic *statusCharacteristic = nullptr;
  bool connected = false;
  bool previousConnected = false;
  uint32_t lastNotifyMs = 0;

  friend class ReactorServerCallbacks;
  friend class ReactorCommandCallbacks;
};
