import mysql.connector
import time
import os
import json
import csv
import base64
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '*******', #Replace with your own Mysql root password
    'database': 'SensorData'
}

# AES encryption configuration
def generate_key():
    return get_random_bytes(32)  # 256-bit key

def encrypt_data(data, key):
    """Encrypts the data and returns Base64 encoded ciphertext"""
    data_str = str(data)
    
    cipher = AES.new(key, AES.MODE_GCM)
    start_time = time.perf_counter()
    ciphertext, tag = cipher.encrypt_and_digest(data_str.encode('utf-8'))
    end_time = time.perf_counter()
    
    encrypted_combined = cipher.nonce + ciphertext
    encrypted_b64 = base64.b64encode(encrypted_combined).decode('utf-8')  # Convert to Base64 string
    
    return {
        'ciphertext': encrypted_b64,
        'time': (end_time - start_time) * 1000  # Convert to milliseconds
    }

def decrypt_data(encrypted_b64, key):
    """Decrypts Base64 encoded ciphertext"""
    encrypted_data = base64.b64decode(encrypted_b64)  # Decode from Base64
    nonce = encrypted_data[:16]
    ciphertext = encrypted_data[16:]
    
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    start_time = time.perf_counter()
    decrypted_data = cipher.decrypt(ciphertext)
    end_time = time.perf_counter()
    
    return {
        'decrypted': decrypted_data.decode('utf-8'),
        'time': (end_time - start_time) * 1000  # Convert to milliseconds
    }

# Main execution
try:
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor(dictionary=True)
    cursor.execute('SELECT * FROM Observations')
    rows = cursor.fetchall()

    key = generate_key()
    key_size = len(key) * 8  # Key size in bits
    encrypted_data = []

    for row in rows:
        date_enc = encrypt_data(row['date'], key)
        time_enc = encrypt_data(row['time'], key)
        AQI_enc = encrypt_data(str(row['AQI']), key)
        
        encryption_time = date_enc['time'] + time_enc['time'] + AQI_enc['time']
        decryption_time = decrypt_data(date_enc['ciphertext'], key)['time'] + \
                          decrypt_data(time_enc['ciphertext'], key)['time'] + \
                          decrypt_data(AQI_enc['ciphertext'], key)['time']
        data_size = len(date_enc['ciphertext']) + len(time_enc['ciphertext']) + len(AQI_enc['ciphertext'])
        
        encrypted_data.append([
            date_enc['ciphertext'], time_enc['ciphertext'], AQI_enc['ciphertext'],
            encryption_time, decryption_time, data_size, key_size
        ])
    
    # Insert into database
    insert_query = """
    INSERT INTO AesGcmData (date_enc, time_enc, AQI_enc, encryption_time, decryption_time, data_size, key_size) 
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(insert_query, encrypted_data)
    connection.commit()
    print("Encrypted data inserted into MySQL table AesGcmData.")

    # Ensure 'csv' directory exists
    csv_dir = 'csv'
    if not os.path.exists(csv_dir):
        os.makedirs(csv_dir)

    # Save results to CSV
    csv_file_path = os.path.join(csv_dir, 'aes_gcm_results.csv')
    with open(csv_file_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'encryptionTime', 'decryptionTime', 'dataSize', 'keySize'])
        for idx, row in enumerate(encrypted_data):
            writer.writerow([idx + 1, row[3], row[4], row[5], row[6]])

    print(f'CSV file created: {csv_file_path}')

except Exception as e:
    print(f"Error: {e}")

finally:
    try:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("Database connection closed.")
    except NameError:
        print("Connection was never established.")
