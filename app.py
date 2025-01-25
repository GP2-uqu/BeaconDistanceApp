import asyncio
import math
from flask import Flask, render_template, jsonify, request
from bleak import BleakScanner

app = Flask(__name__)

# TX Power value for the beacon (RSSI at 1 meter)
TX_POWER = -57  # RSSI at 1 meter
PATH_LOSS_EXPONENT = 2.5  # Environmental factor

selected_beacon = None
latest_rssi = None
latest_distance = None

def calculate_distance(rssi, tx_power=TX_POWER, n=PATH_LOSS_EXPONENT):
    """
    Estimate the distance to the beacon based on RSSI.
    """
    distance = 10 ** ((tx_power - rssi) / (10 * n))
    return round(distance, 2)

@app.route('/')
def home():
    """
    Serve the main HTML page.
    """
    return render_template('index.html')

@app.route('/scan', methods=['GET'])
def scan_devices():
    """
    Scan for BLE devices.
    """
    devices_with_rssi = []

    async def scan():
        def callback(device, advertisement_data):
            devices_with_rssi.append({
                "name": device.name or "Unknown",
                "address": device.address,
                "rssi": advertisement_data.rssi
            })

        scanner = BleakScanner(callback)
        await scanner.start()
        await asyncio.sleep(5)  # Scan for 5 seconds
        await scanner.stop()

    asyncio.run(scan())

    if not devices_with_rssi:
        return jsonify({"error": "No BLE devices found."}), 404

    return jsonify(devices_with_rssi)

@app.route('/select', methods=['POST'])
def select_device():
    """
    Select a beacon by MAC address.
    """
    global selected_beacon
    data = request.get_json()
    selected_beacon = data.get("address")

    if not selected_beacon:
        return jsonify({"error": "No device address provided."}), 400

    return jsonify({"message": f"Device {selected_beacon} selected."})

@app.route('/ping', methods=['GET'])
def ping_device():
    """
    Ping the selected beacon and fetch RSSI and distance.
    """
    global latest_rssi, latest_distance

    if not selected_beacon:
        return jsonify({"error": "No device selected."}), 400

    async def ping():
        async def callback(device, advertisement_data):
            global latest_rssi, latest_distance
            if device.address == selected_beacon:
                latest_rssi = advertisement_data.rssi
                latest_distance = calculate_distance(latest_rssi)

        scanner = BleakScanner(callback)
        await scanner.start()
        await asyncio.sleep(0.5)  # Ping every 0.5 seconds
        await scanner.stop()

    asyncio.run(ping())

    if latest_rssi is None:
        return jsonify({"error": "Device not found."}), 404

    return jsonify({
        "rssi": latest_rssi,
        "distance": latest_distance
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
