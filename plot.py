import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def load_data(file_path):
    """Load encryption and decryption data from CSV file and clean it."""
    df = pd.read_csv(file_path)
    
    # Convert encryptionTime and decryptionTime to numeric, extracting the first number before '±'
    df['encryptionTime'] = df['encryptionTime'].astype(str).str.split('±').str[0].astype(float)
    df['decryptionTime'] = df['decryptionTime'].astype(str).str.split('±').str[0].astype(float)
    
    
    return df

def compute_std(df, algorithm):
    """Compute standard deviation of encryption and decryption times."""
    enc_std = np.std(df['encryptionTime'])
    dec_std = np.std(df['decryptionTime'])
    return algorithm, enc_std, dec_std

def plot_std(results):
    """Plot standard deviation of encryption and decryption times with encryption on one side and decryption on the other."""
    algorithms, enc_std, dec_std = zip(*results)
    x = np.arange(len(algorithms))
    
    colors = ['#1f77b4', '#ff7f0e']  # Define colors for each algorithm
    
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(x - 0.2, enc_std, width=0.4, label='Encryption Std Dev', color=colors[0])
    ax.bar(x + 0.2, dec_std, width=0.4, label='Decryption Std Dev', color=colors[1])
    
    ax.set_xticks(x)
    ax.set_xticklabels(algorithms)
    ax.set_ylabel('Standard Deviation (s)')
    ax.set_title('Standard Deviation of Encryption and Decryption Times')
    ax.legend()
    
    plt.show()

# File paths (update with actual file locations)
aes_file = 'aes_results.csv'
libsodium_file = 'libsodium_results.csv'
pqc_file = 'pqc_results.csv'

aes_data = load_data(aes_file)
libsodium_data = load_data(libsodium_file)
kyber_data = load_data(pqc_file)

results = [
    compute_std(aes_data, 'AES'),
    compute_std(libsodium_data, 'Libsodium'),
    compute_std(kyber_data, "Kyber")
]

plot_std(results)
