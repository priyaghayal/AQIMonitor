# Air Quality Data Encryption & Performance Analysis

## 📋 Project Overview

This project fetches air quality data (observations), stores it in a MySQL database, encrypts the data using various encryption algorithms (AES-CBC, Libsodium, AES-GCM), analyzes performance (encryption/decryption times), and visualizes the results using Python.

The data is sourced from:  
🔗 [OGC API - iCity Data Security](https://ogcapi.hftstuttgart.de/sta/icity_data_security/v1)

This work is an outcome of the project "Datasecurity4ICity", a subproject of [ICity: Intelligent City](https://www.hft-stuttgart.com/research/projects/i-city ). We extend our gratitude for the funding received through the FHImpuls program under the number 13FH9E04IA by the German
Federal Ministry of Education and Research BMBF (Bundesministerium für Bildung und Forschung (Federal Ministry of Education and Research, Germany).

The approach is informed by methodologies described in references [3], [8], [9], and [14].

---

## ⚙️ Prerequisites

### Database Setup

Ensure **MySQL** is installed and running. Then create the database and tables:

```sql
CREATE DATABASE sensordata;
USE sensordata;

CREATE TABLE Observations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE,
    time TIME,
    AQI FLOAT
);

CREATE TABLE AESData (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_enc TEXT NOT NULL,
    time_enc TEXT NOT NULL,
    AQI_enc TEXT NOT NULL,
    encryption_time FLOAT NOT NULL,
    decryption_time FLOAT NOT NULL,
    data_size INT NOT NULL,
    key_size INT NOT NULL
);

CREATE TABLE LibsodiumData (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_enc TEXT NOT NULL,
    time_enc TEXT NOT NULL,
    AQI_enc TEXT NOT NULL,
    encryption_time FLOAT NOT NULL,
    decryption_time FLOAT NOT NULL,
    data_size INT NOT NULL,
    key_size INT NOT NULL
);

CREATE TABLE AesGcmData (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date_enc TEXT NOT NULL,
    time_enc TEXT NOT NULL,
    AQI_enc TEXT NOT NULL,
    encryption_time FLOAT NOT NULL,
    decryption_time FLOAT NOT NULL,
    data_size INT NOT NULL,
    key_size INT NOT NULL
);
```

---

## 📦 Installation

### Node.js Dependencies

Make sure Node.js is installed, then run:

```bash
npm install express axios mysql2 json2csv
npm install libsodium-wrappers
```

### Python Dependencies

```bash
pip install pycryptodome pandas matplotlib mysql-connector-python
```

---

## 🚀 Running the Project

### 🔹 Frontend (HTML Viewer)

- Open `public/index.html` in your browser.
- Click **"Fetch Observations"** to get data from the backend.

### 🔹 Backend API Server (Node.js)

- Start the API server:

```bash
node server.js
```

- API Endpoint: `GET http://localhost:3000/get-observations`  
- Stores observations in the `Observations` table.

---

## 🔐 Encryption Scripts

### AES-CBC Encryption (Node.js)

```bash
node encrypt_aes.js
```

- Encrypts using **AES-256-CBC**
- Stores in `AESData` table
- Outputs: `aes_results.csv`

---

### Libsodium Encryption (Node.js + ESM)

```bash
node libsodiums.js
```

- Uses `libsodium.crypto_secretbox_easy`
- Stores in `LibsodiumData` table
- Outputs: `libsodium_results.csv`

---

### AES-GCM Encryption (Python)

```bash
python encrypt_aes_gcm.py
```

- Uses **AES-256-GCM** via `pycryptodome`
- Stores in `AesGcmData` table
- Outputs: `aes_gcm_results.csv`

---

## 📊 Visualization

- Run Python script (e.g., `plot.py` & `results.py`) to visualize encryption and decryption time standard deviations.
- Ensure CSV files are stored inside a `csv` folder.
- The script outputs bar charts comparing standard deviation across algorithms.
