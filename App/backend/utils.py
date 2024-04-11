from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

THRESHOLD = 0.5

def decrypt(cipher_text, key):
    cipher_rsa = PKCS1_v1_5.new(RSA.import_key(key))
    decrypted_data = cipher_rsa.decrypt(base64.b64decode(cipher_text), "ERROR")
    return decrypted_data.decode('utf-8')

def encrypt(public_key, plaintext):
    # Convert public key to RSA object
    rsa_public_key = RSA.import_key(public_key)

    # Encrypt plaintext
    cipher_rsa = PKCS1_v1_5.new(rsa_public_key)
    encrypted_text = cipher_rsa.encrypt(plaintext.encode('utf-8'))

    # Base64 encode the encrypted text
    encrypted_text_base64 = base64.b64encode(encrypted_text).decode('utf-8')

    return encrypted_text_base64

def check_intersection(sorted_set1, sorted_set2):
    # Initialize pointers and intersection size
    pointer1 = pointer2 = 0
    intersection_size = 0

    # Iterate through both sets
    while pointer1 < len(sorted_set1) and pointer2 < len(sorted_set2):
        # If elements at current pointers are equal, increment intersection size
        if sorted_set1[pointer1] == sorted_set2[pointer2]:
            intersection_size += 1
            pointer1 += 1
            pointer2 += 1
        # If element in set 1 is smaller, move pointer1
        elif sorted_set1[pointer1] < sorted_set2[pointer2]:
            pointer1 += 1
        # If element in set 2 is smaller, move pointer2
        else:
            pointer2 += 1

    return intersection_size >= THRESHOLD*min(len(sorted_set1), len(sorted_set2))