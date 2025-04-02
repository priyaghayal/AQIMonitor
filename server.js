const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const path = require('path');

// MySQL connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Priya@1234', // Replace with your actual MySQL root password
    database: 'sensordata'
};

// Initialize the Express app
const app = express();
app.use(express.json());

// Serve the client-side HTML file
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch observations from the external API and store in MySQL
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

        // Establish a MySQL connection
        const connection = await mysql.createConnection(dbConfig);

        // SQL Query to insert data
        const sql = `INSERT INTO Observations (date, time, AQI) VALUES (?, ?, ?)`;

        // Format and insert data into MySQL
        const formattedObservations = [];

        for (const [index, observation] of observations.entries()) {
            const phenomenonTime = observation.phenomenonTime || null;
            const AQI = observation.result || null;

            if (!phenomenonTime || AQI === null) {
                continue; // Skip incomplete data
            }

            // Split phenomenonTime into date and time
            const [datePart, timePart] = phenomenonTime.split('T');
            const date = datePart || 'N/A';
            const time = timePart ? timePart.split('Z')[0] : 'N/A'; // Remove 'Z' from time

            // Insert into MySQL database
            await connection.execute(sql, [date, time, AQI]);

            formattedObservations.push({
                id: index + 1,
                date,
                time,
                AQI
            });
        }

        // Close the MySQL connection
        await connection.end();

        // Send formatted data as response
        res.status(200).json(formattedObservations);
    } catch (error) {
        console.error('Error fetching or storing observations:', error.message);
        res.status(500).send({ error: 'Failed to fetch or store observations.', details: error.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
