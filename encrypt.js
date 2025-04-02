const express = require('express');
const axios = require('axios');
const path = require('path');

// Initialize the Express app
const app = express();
app.use(express.json());

// Serve the client-side HTML file
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch observations from the external API
app.get('/get-observations', async (req, res) => {
    try {
        // Fetch data from the Observations API
        const apiUrl = 'https://ogcapi.hft-stuttgart.de/sta/frost-luftdata-api/v1.1/Observations';
        const response = await axios.get(apiUrl);

        // Check if the response contains the expected data
        const observations = response.data.value;
        if (!observations || !Array.isArray(observations)) {
            throw new Error('Invalid API response format');
        }

        // Format the data
        const formattedObservations = observations.map((observation, index) => {
            const phenomenonTime = observation.phenomenonTime || null;
            const AQI = observation.result || null;

            if (!phenomenonTime || AQI === null) {
                return {
                    id: index + 1,
                    date: 'N/A',
                    time: 'N/A',
                    AQI: 'N/A'
                };
            }

            // Split phenomenonTime into date and time
            const [datePart, timePart] = phenomenonTime.split('T');
            const date = datePart || 'N/A';
            const time = timePart ? timePart.split('Z')[0] : 'N/A'; // Remove 'Z' from the time

            return {
                id: index + 1,
                date,
                time,
                AQI
            };
        });

        // Send the formatted data as a JSON response
        res.status(200).json(formattedObservations);
    } catch (error) {
        // Log and send error response
        console.error('Error fetching observations from API:', error.message);
        res.status(500).send({ error: 'Failed to fetch observations.', details: error.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
