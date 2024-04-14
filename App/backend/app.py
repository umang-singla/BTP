from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from flask_cors import CORS
from utils import decrypt, encrypt, check_intersection, aes_decrypt, aes_encrypt
import base64

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/myDatabase"
mongo = PyMongo(app)
CORS(app)

# Generate RSA key pair
key = RSA.generate(2048)

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
    key = decrypt(data['key'], keys['private_key'])
    iv = decrypt(data['iv'], keys['private_key'])

    coordinates = []
    for i in range(0, len(data["coordinates"])):
        coordinates.append((aes_decrypt(data["coordinates"][i]["lat"], key, iv),
                           aes_decrypt(data["coordinates"][i]["lng"], key, iv)))
        
    records = mongo.db.inventory.find()

    for record in records:
        arr = []
        key = decrypt(record['key'], keys['private_key'])
        iv = decrypt(record['iv'], keys['private_key'])

        for i in range(len(record['coordinates'])):
            arr.append((float(aes_decrypt(record['coordinates'][i]['lat'], key, iv)), float(aes_decrypt(record['coordinates'][i]['lng'], key, iv))))

        if check_intersection(coordinates, arr):
            count += 1

    response = {"count": count}

    return jsonify(response), 200

@app.route('/fetch_rides', methods=['GET'])
def fetch_rides():
    records = mongo.db.inventory.find()

    result = []

    for record in records:
        # Convert ObjectId to string for JSON serialization
        key = decrypt(record['key'], keys['private_key'])
        iv = decrypt(record['iv'], keys['private_key'])
        data = {"_id": str(record['_id']),
                "coordinates": []
                }
        print(type(aes_encrypt(aes_decrypt(record['coordinates'][0]['lat'], key, iv), key, iv)))
        data['coordinates'].append({
            'lat': aes_encrypt(aes_decrypt(record['coordinates'][0]['lat'], key, iv), key, iv),
            'lng': aes_encrypt(aes_decrypt(record['coordinates'][0]['lng'], key, iv), key, iv)
            })
        
        data['coordinates'].append({
            'lat': aes_encrypt(aes_decrypt(record['coordinates'][-1]['lat'], key, iv), key, iv),
            'lng': aes_encrypt(aes_decrypt(record['coordinates'][-1]['lng'], key, iv), key, iv)
            })

        result.append(data)
    
    return jsonify(result), 200

@app.route('/publish_ride', methods=['POST'])
def publish_ride():
    data = request.get_json()
    key = decrypt(data['key'], keys['private_key'])
    iv = decrypt(data['iv'], keys['private_key'])
    mongo.db.inventory.insert_one(data)

    return jsonify({'successs': True}), 200


if __name__ == '__main__':
    app.run(debug=True)
