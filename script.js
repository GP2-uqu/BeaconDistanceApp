const TX_POWER = -57; // RSSI at 1 meter
const PATH_LOSS_EXPONENT = 2.5; // Environmental factor

let pingInterval; // To hold the interval for live updates

document.getElementById("scan").addEventListener("click", async () => {
    const output = document.getElementById("output");
    const stopButton = document.getElementById("stop");
    output.innerHTML = "Scanning for devices...";

    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true, // Allow any device
            optionalServices: ["device_information"] // Add optional GATT services if needed
        });

        output.innerHTML = `Connected to: ${device.name || "Unknown"}<br>Starting live updates...`;

        const server = await device.gatt.connect();

        stopButton.style.display = "inline-block"; // Show the stop button
        startLiveUpdates(server, output);
    } catch (error) {
        output.innerHTML = `Error: ${error.message}`;
    }
});

// Stop button event listener
document.getElementById("stop").addEventListener("click", () => {
    clearInterval(pingInterval); // Stop the live updates
    const stopButton = document.getElementById("stop");
    stopButton.style.display = "none"; // Hide the stop button
    document.getElementById("output").innerHTML += "<br>Live updates stopped.";
});

// Function to start live RSSI updates
function startLiveUpdates(server, output) {
    clearInterval(pingInterval); // Clear any previous interval

    pingInterval = setInterval(async () => {
        try {
            const rssi = await fetchRSSI(server); // Simulate or fetch RSSI
            const distance = calculateDistance(rssi);

            output.innerHTML = `
                Device: Connected<br>
                RSSI: ${rssi} dBm<br>
                Estimated Distance: ${distance} meters
            `;
        } catch (error) {
            output.innerHTML = `Error fetching RSSI: ${error.message}`;
            clearInterval(pingInterval); // Stop updates if an error occurs
        }
    }, 1000); // Update every second
}

// Simulate fetching RSSI (replace this with actual logic if supported by your device)
function fetchRSSI(server) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const simulatedRSSI = -60 + Math.floor(Math.random() * 10); // Simulate fluctuating RSSI
            resolve(simulatedRSSI);
        }, 500); // Simulate delay
    });
}

// Calculate distance based on RSSI
function calculateDistance(rssi) {
    return Math.pow(10, (TX_POWER - rssi) / (10 * PATH_LOSS_EXPONENT)).toFixed(2);
}
