#include "BleReactorTransport.h"

static const char *DEVICE_NAME = "Arc Reactor";
static const char *SERVICE_UUID = "b7e90001-78fb-4f2c-9b8f-a1c000000001";
static const char *COMMAND_CHARACTERISTIC_UUID = "b7e90002-78fb-4f2c-9b8f-a1c000000002";
static const char *STATUS_CHARACTERISTIC_UUID = "b7e90003-78fb-4f2c-9b8f-a1c000000003";
static BleReactorTransport *activeTransport = nullptr;

class ReactorServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) override {
    (void)server;
    if (activeTransport != nullptr) {
      activeTransport->connected = true;
    }
  }

  void onDisconnect(BLEServer *server) override {
    (void)server;
    if (activeTransport != nullptr) {
      activeTransport->connected = false;
    }
    BLEDevice::startAdvertising();
  }
};

class ReactorCommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    auto rawValue = characteristic->getValue();
    String payload = String(rawValue.c_str());
    if (payload.length() == 0 || activeTransport == nullptr) {
      return;
    }

    StaticJsonDocument<1536> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
      StaticJsonDocument<256> response;
      response["type"] = "error";
      response["message"] = error.c_str();
      String output;
      serializeJson(response, output);
      activeTransport->statusCharacteristic->setValue(output.c_str());
      activeTransport->statusCharacteristic->notify();
      return;
    }

    updateReactorStateFromJson(doc.as<JsonVariantConst>());
    const char *requestId = doc["requestId"] | nullptr;
    activeTransport->notifyStatus(requestId);
  }
};

void BleReactorTransport::begin() {
  activeTransport = this;
  BLEDevice::init(DEVICE_NAME);
  BLEDevice::setMTU(517);

  server = BLEDevice::createServer();
  server->setCallbacks(new ReactorServerCallbacks());

  service = server->createService(SERVICE_UUID);
  commandCharacteristic = service->createCharacteristic(
    COMMAND_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  commandCharacteristic->setCallbacks(new ReactorCommandCallbacks());

  statusCharacteristic = service->createCharacteristic(
    STATUS_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  statusCharacteristic->addDescriptor(new BLE2902());

  service->start();

  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  advertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
}

void BleReactorTransport::poll(uint32_t nowMs) {
  if (connected && nowMs - lastNotifyMs >= 1000) {
    notifyStatus();
  }

  if (!connected && previousConnected) {
    delay(120);
    BLEDevice::startAdvertising();
  }

  previousConnected = connected;
}

bool BleReactorTransport::isConnected() const {
  return connected;
}

void BleReactorTransport::notifyStatus(const char *ackRequestId) {
  if (statusCharacteristic == nullptr) {
    return;
  }

  StaticJsonDocument<1536> doc;
  writeStatusJson(doc, copyReactorState(), ackRequestId);

  String output;
  serializeJson(doc, output);
  statusCharacteristic->setValue(output.c_str());
  if (connected) {
    statusCharacteristic->notify();
  }
  lastNotifyMs = millis();
}
