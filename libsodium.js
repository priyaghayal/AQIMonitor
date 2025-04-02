import mysql from 'mysql2/promise';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import { parse } from 'json2csv';
import sodium from 'libsodium-wrappers';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Priya@1234',
    database: 'SensorData'
};

(async () => {
    await sodium.ready;

    async function encryptData(data) {
        try {
            const key = sodium.crypto_secretbox_keygen();
            const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
            const startTime = performance.now();
            const encrypted = sodium.crypto_secretbox_easy(data, nonce, key);
            const endTime = performance.now();
            return { encrypted: Buffer.from(encrypted).toString('hex'), time: endTime - startTime, key, nonce, keySize: key.length * 8 };
        } catch (error) {
            console.error("Encryption error:", error);
            return { encrypted: '', time: 0, key: null, nonce: null, keySize: 0 };
        }
    }

    async function decryptData(encryptedData, key, nonce) {
        try {
            const startTime = performance.now();
            const decrypted = sodium.crypto_secretbox_open_easy(Buffer.from(encryptedData, 'hex'), nonce, key);
            const endTime = performance.now();
            return { decrypted: Buffer.from(decrypted).toString(), time: endTime - startTime };
        } catch (error) {
            console.error("Decryption error:", error);
            return { decrypted: '', time: 0 };
        }
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to MySQL database!");

        const [rows] = await connection.execute('SELECT * FROM Observations');
        const encryptedData = [];

        for (const row of rows) {
            const dateEnc = await encryptData(row.date ? row.date.toString() : '');
            const timeEnc = await encryptData(row.time ? row.time.toString() : '');
            const AQIEnc = await encryptData(row.AQI ? row.AQI.toString() : '');

            const encryptionTime = dateEnc.time + timeEnc.time + AQIEnc.time;
            const decryptionTime = (await decryptData(dateEnc.encrypted, dateEnc.key, dateEnc.nonce)).time +
                                   (await decryptData(timeEnc.encrypted, timeEnc.key, timeEnc.nonce)).time +
                                   (await decryptData(AQIEnc.encrypted, AQIEnc.key, AQIEnc.nonce)).time;
            const dataSize = Buffer.byteLength(dateEnc.encrypted + timeEnc.encrypted + AQIEnc.encrypted, 'utf8');
            const keySize = dateEnc.keySize; 

            encryptedData.push([dateEnc.encrypted, timeEnc.encrypted, AQIEnc.encrypted, encryptionTime, decryptionTime, dataSize, keySize]);
        }

        if (encryptedData.length > 0) {
            const insertQuery = `
                INSERT INTO LibsodiumData (date_enc, time_enc, AQI_enc, encryption_time, decryption_time, data_size, key_size) 
                VALUES ?
            `;
            await connection.query(insertQuery, [encryptedData]);
            console.log('Encrypted data inserted into MySQL table LibsodiumData.');
        }

        const csvData = encryptedData.map((row, index) => ({
            id: index + 1,
            encryptionTime: row[3],
            decryptionTime: row[4],
            dataSize: row[5],
            keySize: row[6]
        }));

        const csv = parse(csvData, { fields: ['id', 'encryptionTime', 'decryptionTime', 'dataSize', 'keySize'] });

        if (!fs.existsSync('./csv')) {
            fs.mkdirSync('./csv', { recursive: true });
        }
        fs.writeFileSync('./csv/libsodium_results.csv', csv);
        console.log('CSV file created: ./csv/libsodium_results.csv');
    } catch (error) {
        console.error('Error during encryption:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
    }
})();
