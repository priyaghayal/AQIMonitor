const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');
const fs = require('fs');
const { parse } = require('json2csv');
const ntru = require('node-ntru'); // NTRUEncrypt post-quantum cryptography

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Priya@1234',
    database: 'SensorData'
};

// Generate NTRU key pair
const startKeyGen = performance.now();
const keyPair = ntru.keyPair();
const endKeyGen = performance.now();
const keySize = keyPair.publicKey.length * 8; // Key size in bits
const keyGenTime = endKeyGen - startKeyGen;

// Function to encrypt data
function encryptData(data) {
    const startTime = performance.now();
    const encrypted = ntru.encrypt(Buffer.from(data), keyPair.publicKey);
    const endTime = performance.now();
    return { encrypted: encrypted.toString('hex'), time: endTime - startTime };
}

// Function to decrypt data
function decryptData(encryptedData) {
    const startTime = performance.now();
    const decrypted = ntru.decrypt(Buffer.from(encryptedData, 'hex'), keyPair.privateKey);
    const endTime = performance.now();
    return { decrypted: decrypted.toString(), time: endTime - startTime };
}

(async () => {
    let connection;

    try {
        // Connect to the database
        connection = await mysql.createConnection(dbConfig);

        // Fetch data from the Observations table
        const [rows] = await connection.execute('SELECT * FROM Observations');

        // Encrypt each row's data and measure data size
        const encryptedData = rows.map(row => {
            const dateEnc = encryptData(row.date ? row.date.toString() : '');
            const timeEnc = encryptData(row.time ? row.time.toString() : '');
            const AQIEnc = encryptData(row.AQI ? row.AQI.toString() : '');
            
            return {
                id: row.id,
                encryptionTime: dateEnc.time + timeEnc.time + AQIEnc.time,
                decryptionTime: decryptData(dateEnc.encrypted).time + decryptData(timeEnc.encrypted).time + decryptData(AQIEnc.encrypted).time,
                dataSize: Buffer.byteLength(dateEnc.encrypted + timeEnc.encrypted + AQIEnc.encrypted, 'utf8'),
                keySize
            };
        });

        // Convert to CSV format
        const csv = parse(encryptedData, { fields: ['id', 'encryptionTime', 'decryptionTime', 'dataSize', 'keySize'] });
        fs.writeFileSync('encryption_data.csv', csv);
        console.log('CSV file created: encryption_data.csv');
        console.log('Key Generation Time:', keyGenTime.toFixed(4), 'ms');
    } catch (error) {
        console.error('Error during encryption:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
})();
