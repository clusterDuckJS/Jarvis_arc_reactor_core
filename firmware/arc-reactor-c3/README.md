# Arc Reactor ESP32-C3 Firmware

Arduino sketch for the Arc Reactor OS Web Bluetooth JSON protocol.

## Device

- BLE name: `Arc Reactor`
- Service UUID: `b7e90001-78fb-4f2c-9b8f-a1c000000001`
- Command characteristic UUID: `b7e90002-78fb-4f2c-9b8f-a1c000000002`
- Status characteristic UUID: `b7e90003-78fb-4f2c-9b8f-a1c000000003`

## Libraries

- Arduino ESP32 core BLE library (`BLEDevice`, `BLEServer`, `BLECharacteristic`)
- ESP32 Arduino calibrated ADC API (`analogReadMilliVolts`)
- ArduinoJson
- Adafruit NeoPixel

## Pins

Edit these constants in `arc-reactor-c3.ino` for your board:

- `LED_PIN = 2`
- `TOUCH_PIN = 4`
- `BATTERY_ADC_PIN = 0`
- `LED_COUNT = 16`

## Battery Monitoring

- Battery: 1-cell LiPo through a TP4056 protection/charger board
- Divider: 214kΩ from Battery+ to ADC, 98kΩ from ADC to GND
- Divider multiplier: `3.183673`
- ADC pin setup: GPIO0, 12-bit resolution, 6 dB attenuation
- ADC sampling: 32 calibrated millivolt samples, collected non-blockingly about every 5 seconds
- BLE status: the latest cached battery reading is reported as `diagnostics.voltage`, with `diagnostics.batteryPercent` mapped across 3.0V-4.2V
- Troubleshooting: set `ENABLE_BATTERY_MONITOR` to `0` in `arc-reactor-c3.ino` to confirm the rest of the firmware still boots without ADC reads

BLE command callbacks only update shared `ReactorState`. The LED animation engine reads snapshots of that state in `loop()` and renders independently.
