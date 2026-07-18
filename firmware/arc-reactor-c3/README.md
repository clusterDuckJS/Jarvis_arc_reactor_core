# Arc Reactor ESP32-C3 Firmware

Arduino sketch for the Arc Reactor OS Web Bluetooth JSON protocol.

## Device

- BLE name: `Arc Reactor`
- Service UUID: `b7e90001-78fb-4f2c-9b8f-a1c000000001`
- Command characteristic UUID: `b7e90002-78fb-4f2c-9b8f-a1c000000002`
- Status characteristic UUID: `b7e90003-78fb-4f2c-9b8f-a1c000000003`

## Libraries

- Arduino ESP32 core BLE library (`BLEDevice`, `BLEServer`, `BLECharacteristic`)
- ArduinoJson
- Adafruit NeoPixel

## Pins

Edit these constants in `arc-reactor-c3.ino` for your board:

- `LED_PIN = 2`
- `TOUCH_PIN = 4`
- `LED_COUNT = 16`

BLE command callbacks only update shared `ReactorState`. The LED animation engine reads snapshots of that state in `loop()` and renders independently.
