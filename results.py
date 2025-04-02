import os
import pandas as pd

def process_csv_files(folder_path):
    # Define the file names and corresponding algorithm names
    files = {
        "aes_results.csv": "AES",
        "libsodium_results.csv": "Libsodium",
        "pqc_results.csv": "PQC"
    }
    
    # Lists to store data for tables
    table1 = []  # Columns: algo, keysize, enc time, dec time
    table2 = []  # Columns: algo, data size, enc time, dec time
    
    for file_name, algo_name in files.items():
        file_path = os.path.join(folder_path, file_name)
        
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            
            # Group by keySize and calculate average encryption and decryption time
            keysize_group = df.groupby("keySize")[["encryptionTime", "decryptionTime"]].mean().reset_index()
            for _, row in keysize_group.iterrows():
                table1.append([algo_name, row["keySize"], row["encryptionTime"], row["decryptionTime"]])
            
            # Group by dataSize and calculate average encryption and decryption time
            datasize_group = df.groupby("dataSize")[["encryptionTime", "decryptionTime"]].mean().reset_index()
            for _, row in datasize_group.iterrows():
                table2.append([algo_name, row["dataSize"], row["encryptionTime"], row["decryptionTime"]])
    
    # Convert lists to DataFrames
    table1_df = pd.DataFrame(table1, columns=["Algorithm", "Key Size", "Avg Encryption Time", "Avg Decryption Time"])
    table2_df = pd.DataFrame(table2, columns=["Algorithm", "Data Size", "Avg Encryption Time", "Avg Decryption Time"])
    
    return table1_df, table2_df

# Folder path where CSV files are stored
csv_folder = "csv"

# Process the CSV files and generate tables
table1, table2 = process_csv_files(csv_folder)

# Display the tables
print("Table 1: Algorithm vs Key Size")
print(table1.to_string(index=False))
print("\nTable 2: Algorithm vs Data Size")
print(table2.to_string(index=False))