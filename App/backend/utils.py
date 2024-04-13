from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Hash import SHA256
import base64

import geopy.distance

THRESHOLD = 0.5
DELTA = 300

def decrypt(cipher_text, key):
    cipher_rsa = PKCS1_OAEP.new(RSA.import_key(key), hashAlgo=SHA256)
    decrypted_data = cipher_rsa.decrypt(base64.b64decode(cipher_text))
    return decrypted_data.decode('utf-8')

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
    # Iterate through arr1 to find all subarrays of length T
    T = int(THRESHOLD*min(len(arr1), len(arr2)))
    subarrays1 = set(tuple(arr1[i:i+T]) for i in range(len(arr1) - T + 1))

    # Iterate through arr2 to find matching subarrays
    for i in range(len(arr2) - T + 1):
        subarray2 = tuple(arr2[i:i+T])
        for arr in subarrays1:
            if check_similarity(arr, subarray2):
                return True

    return False