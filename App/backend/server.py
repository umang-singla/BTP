from flask import Flask, jsonify, request
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64

app = Flask(__name__)

@app.route('/generate_keys', methods=['GET'])
def generate_keys():
    # Generate RSA key pair
    key = RSA.generate(2048)

    # Extract private and public keys
    private_key = key.export_key().decode('utf-8')
    public_key = key.publickey().export_key().decode('utf-8')

    # Response as JSON
    response = {
        'private_key': private_key,
        'public_key': public_key
    }

    return jsonify(response), 200

@app.route('/encrypt', methods=['POST'])
def encrypt():
    data = request.get_json()

    # Get public key from request
    public_key = data['public_key']

    # Convert public key to RSA object
    rsa_public_key = RSA.import_key(public_key)

    # Get plaintext from request
    plaintext = data['plaintext']

    # Encrypt plaintext
    cipher_rsa = PKCS1_OAEP.new(rsa_public_key)
    encrypted_text = cipher_rsa.encrypt(plaintext.encode('utf-8'))

    # Base64 encode the encrypted text
    encrypted_text_base64 = base64.b64encode(encrypted_text).decode('utf-8')

    # Response as JSON
    response = {
        'encrypted_text': encrypted_text_base64
    }

    return jsonify(response), 200

if __name__ == '__main__':
    app.run(debug=True)
