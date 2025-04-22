import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load your CSV files
aes_df = pd.read_csv("csv/aes_results.csv")
libsodium_df = pd.read_csv("csv/libsodium_results.csv")
aes_gcm_df = pd.read_csv("csv/aes_gcm_results.csv")  

# Target aligned data sizes
target_sizes = [100, 150, 200, 250]

# Function to interpolate to the target sizes
def interpolate_to_targets(df, method_name):
    df_sorted = df.sort_values('dataSize')
    interp_df = pd.DataFrame({
        'dataSize': target_sizes,
        'encryptionTime': np.interp(target_sizes, df_sorted['dataSize'], df_sorted['encryptionTime']),
        'decryptionTime': np.interp(target_sizes, df_sorted['dataSize'], df_sorted['decryptionTime']),
        'Method': method_name
    })
    return interp_df

# Interpolate each method
aes_interp = interpolate_to_targets(aes_df, 'aes-cbc')
libsodium_interp = interpolate_to_targets(libsodium_df, 'libsodium')
aes_gcm_interp = interpolate_to_targets(aes_gcm_df, 'aes-gcm')

# Combine interpolated data
aligned_df = pd.concat([aes_interp, libsodium_interp, aes_gcm_interp])

# Pivot tables for plotting
grouped_df = aligned_df.groupby(['dataSize', 'Method'])[['encryptionTime', 'decryptionTime']].mean().reset_index()
enc_pivot = grouped_df.pivot(index='dataSize', columns='Method', values='encryptionTime')
dec_pivot = grouped_df.pivot(index='dataSize', columns='Method', values='decryptionTime')

# Define custom colors
colors = {
    'aes-cbc': '#1f77b4',
    'libsodium': '#2ca02c',
    'aes-gcm': '#d62728'
}

# Plot
fig, axs = plt.subplots(2, 1, figsize=(10, 8), sharex=True)

# Encryption
enc_pivot.plot(kind='bar', ax=axs[0], color=[colors[col] for col in enc_pivot.columns])
axs[0].set_title('Interpolated Encryption Time (Aligned Data Sizes)')
axs[0].set_ylabel('Time (ms)')
axs[0].legend(title='Method')

# Decryption
dec_pivot.plot(kind='bar', ax=axs[1], color=[colors[col] for col in dec_pivot.columns])
axs[1].set_title('Interpolated Decryption Time (Aligned Data Sizes)')
axs[1].set_xlabel('Data Size (bytes)')
axs[1].set_ylabel('Time (ms)')
axs[1].legend(title='Method')

plt.tight_layout()
plt.show()
