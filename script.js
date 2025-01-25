let selectedDevice = null; // Store selected device
let pingInterval = null; // For live updates

document.getElementById("scan").addEventListener("click", async () => {
    const output = document.getElementById("output");
    output.innerHTML = "Scanning for devices...";

    try {
        // Step 1: Fetch available devices
        const response = await fetch("http://127.0.0.1:5000/scan"); // Use your Flask server address
        const devices = await response.json();

        if (devices.error) {
            output.innerHTML = `Error: ${devices.error}`;
            return;
        }

        // Show the list of devices
        output.innerHTML = "Available Devices:<br>";
        devices.forEach((device, index) => {
            output.innerHTML += `${index + 1}: ${device.name || "Unknown"} (${device.address}) - RSSI: ${device.rssi} dBm<br>`;
        });

        // Prompt the user to select a device
        const choice = prompt("Enter the number of the device to select:");
        const device = devices[parseInt(choice) - 1];
        if (!device) {
            output.innerHTML = "Invalid selection.";
            return;
        }

        selectedDevice = device.address;

        // Step 2: Select the device via the backend
        const selectResponse = await fetch("http://127.0.0.1:5000/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: selectedDevice })
        });

        const selectResult = await selectResponse.json();
        if (selectResult.error) {
            output.innerHTML = `Error: ${selectResult.error}`;
            return;
        }

        output.innerHTML = `Selected Device: ${device.name || "Unknown"} (${device.address})<br>Starting RSSI updates...`;

        // Step 3: Start fetching RSSI and distance
        startFetchingRSSI(output);
    } catch (error) {
        output.innerHTML = `Error: ${error.message}`;
    }
});

document.getElementById("stop").addEventListener("click", () => {
    clearInterval(pingInterval);
    document.getElementById("output").innerHTML += "<br>Stopped updates.";
});

function startFetchingRSSI(output) {
    clearInterval(pingInterval);

    pingInterval = setInterval(async () => {
        try {
            // Fetch RSSI and distance from the backend
            const response = await fetch("http://127.0.0.1:5000/ping");
            const data = await response.json();

            if (data.error) {
                output.innerHTML = `Error: ${data.error}`;
                clearInterval(pingInterval);
                return;
            }

            output.innerHTML = `
                Device: Beacon<br>
                RSSI: ${data.rssi} dBm<br>
                Estimated Distance: ${data.distance} meters
            `;
        } catch (error) {
            console.error("Error fetching RSSI:", error.message);
        }
    }, 1000);
}
