from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256
import base64


import geopy.distance

from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

THRESHOLD = 0.5
DELTA = 300

def aes_encrypt(plaintext, key, iv):
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct_bytes = cipher.encrypt(pad(plaintext.encode(), AES.block_size))
    return base64.b64encode(ct_bytes).decode()

def aes_decrypt(ciphertext, key, iv):
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(base64.b64decode(ciphertext)), AES.block_size)
    return pt.decode()

def decrypt(cipher_text, key):
    cipher_rsa = PKCS1_OAEP.new(RSA.import_key(key), hashAlgo=SHA256)
    decrypted_data = cipher_rsa.decrypt(base64.b64decode(cipher_text))
    return decrypted_data

def encrypt(public_key, data):
    # Convert public key to RSA object
    rsa_public_key = RSA.import_key(public_key)

    # Encrypt plaintext
    cipher_rsa = PKCS1_OAEP.new(rsa_public_key, hashAlgo=SHA256)
    encrypted_text = cipher_rsa.encrypt(data.encode('utf-8'))

    # Base64 encode the encrypted text
    encrypted_text_base64 = base64.b64encode(encrypted_text).decode('utf-8')

    return encrypted_text_base64

def check_similarity(arr1, arr2):
    for i in range(len(arr1)):
        if geopy.distance.geodesic(arr1[i], arr2[i]).m > DELTA:
            return False
        
    return True

def check_intersection(arr1, arr2):
    m, n = len(arr1), len(arr2)
    
    # Create a 2D array to store the lengths of longest common subarray
    # endings at each pair of indices
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # Variable to store the maximum length of common subarray found
    max_length = 0

    # Fill the dp array
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if geopy.distance.geodesic(arr1[i-1], arr2[j-1]).m <= DELTA:
                dp[i][j] = dp[i - 1][j - 1] + 1
                max_length = max(max_length, dp[i][j])
            else:
                dp[i][j] = 0

    if max_length >= int(THRESHOLD*min(len(arr1), len(arr2))):
        return True
    return False
