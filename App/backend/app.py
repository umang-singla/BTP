from flask import Flask, jsonify, request
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from flask_cors import CORS
from utils import decrypt, encrypt, check_intersection
import base64

app = Flask(__name__)
CORS(app)

# Generate RSA key pair
key = RSA.generate(2048)

available_rides = []

keys = {
    "private_key": key.export_key().decode('utf-8'),
    "public_key": key.publickey().export_key().decode('utf-8')
}

@app.route('/generate_keys', methods=['GET'])
def generate_keys():
    # Response as JSON
    response = {
        'public_key': keys["public_key"]
    }

    return jsonify(response), 200

@app.route('/find_ride', methods=['POST'])
def find_ride():
    data = request.get_json()

    count = 0
    for i in range(0, len(data["coordinates"])):
        data["coordinates"][i] = decrypt(data["coordinates"][i], keys['private_key'])

    for ride in available_rides:
        coordinates = []
        for i in ride["coordinates"]:
            coordinates.append(decrypt(i, keys['private_key']))

        if check_intersection(coordinates, data["coordinates"]):
            count += 1

    response = {"count": count}

    return jsonify(response), 200

    

@app.route('/publish_ride', methods=['POST'])
def publish_ride():
    data = request.get_json()
    available_rides.append(data)

    return jsonify({'successs': True}), 200


if __name__ == '__main__':
    app.run(debug=True)
