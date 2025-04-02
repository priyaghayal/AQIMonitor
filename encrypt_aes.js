const mysql = require('mysql2/promise');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Priya@1234',
    database: 'SensorData'
};

// AES encryption configuration
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // Use a secure, consistent key in production
const iv = crypto.randomBytes(16);
const keySize = key.length * 8;

// Function to encrypt data
function encryptData(data) {
    const startTime = performance.now();
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const endTime = performance.now();
    return { encrypted, time: endTime - startTime };
}

// Function to decrypt data
function decryptData(encryptedData) {
    const startTime = performance.now();
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const endTime = performance.now();
    return { decrypted, time: endTime - startTime };
}

(async () => {
    let connection;

    try {
        // Connect to the database
        connection = await mysql.createConnection(dbConfig);

        // Fetch data from the Observations table
        const [rows] = await connection.execute('SELECT * FROM Observations');

        // Encrypt each row's data
        const encryptedData = [];
        for (const row of rows) {
            const dateEnc = encryptData(row.date ? row.date.toString() : '');
            const timeEnc = encryptData(row.time ? row.time.toString() : '');
            const AQIEnc = encryptData(row.AQI ? row.AQI.toString() : '');

            const encryptionTime = dateEnc.time + timeEnc.time + AQIEnc.time;
            const decryptionTime = decryptData(dateEnc.encrypted).time + decryptData(timeEnc.encrypted).time + decryptData(AQIEnc.encrypted).time;
            const dataSize = Buffer.byteLength(dateEnc.encrypted + timeEnc.encrypted + AQIEnc.encrypted, 'utf8');

            encryptedData.push([dateEnc.encrypted, timeEnc.encrypted, AQIEnc.encrypted, encryptionTime, decryptionTime, dataSize, keySize]);
        }

        // Insert encrypted data into a simple table name "AESData"
        if (encryptedData.length > 0) {
            const insertQuery = `
                INSERT INTO AESData (date_enc, time_enc, AQI_enc, encryption_time, decryption_time, data_size, key_size) 
                VALUES ?
            `;
            await connection.query(insertQuery, [encryptedData]);
            console.log('Encrypted data inserted into MySQL table AESData.');
        }

        // Ensure 'csv' directory exists
        const csvDir = path.join(__dirname, 'csv');
        if (!fs.existsSync(csvDir)) {
            fs.mkdirSync(csvDir, { recursive: true });
        }

        // Convert to CSV format
        const csv = parse(
            encryptedData.map((row, index) => ({
                id: index + 1,
                encryptionTime: row[3],
                decryptionTime: row[4],
                dataSize: row[5],
                keySize: row[6]
            })),
            { fields: ['id', 'encryptionTime', 'decryptionTime', 'dataSize', 'keySize'] }
        );

        const csvFilePath = path.join(csvDir, 'aes_results.csv');
        fs.writeFileSync(csvFilePath, csv);
        console.log(`CSV file created: ${csvFilePath}`);
        console.log('Key Size:', keySize, 'bits');
    } catch (error) {
        console.error('Error during encryption:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
})();