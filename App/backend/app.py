from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from flask_cors import CORS
from utils import decrypt, encrypt, check_intersection
import base64

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/myDatabase"
mongo = PyMongo(app)
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
    coordinates = []
    for i in range(0, len(data["coordinates"])):
        coordinates.append((decrypt(data["coordinates"][i]["lat"], keys['private_key']),
                           decrypt(data["coordinates"][i]["lng"], keys['private_key'])))
        
    records = mongo.db.inventory.find()

    for record in records:
        arr = []
        for i in range(len(record['coordinates'])):
            arr.append((decrypt(record['coordinates'][i]['lat'], keys['private_key']), decrypt(record['coordinates'][i]['lng'], keys['private_key'])))

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
        data = {"_id": str(record['_id']),
                "coordinates": []
                }
        data['coordinates'].append({
            'lat': encrypt(record['public_key'], decrypt(record['coordinates'][0]['lat'], keys['private_key'])),
            'lng': encrypt(record['public_key'], decrypt(record['coordinates'][0]['lng'], keys['private_key']))
            })
        
        data['coordinates'].append({
            'lat': encrypt(record['public_key'], decrypt(record['coordinates'][-1]['lat'], keys['private_key'])),
            'lng': encrypt(record['public_key'], decrypt(record['coordinates'][-1]['lng'], keys['private_key']))
            })
        # for i in range(len(record['coordinates'])):
        #     record['coordinates'][i]['lat'] = encrypt(record['public_key'], decrypt(record['coordinates'][i]['lat'], keys['private_key']))
        #     record['coordinates'][i]['lng'] = encrypt(record['public_key'], decrypt(record['coordinates'][i]['lng'], keys['private_key']))
        result.append(data)
    
    return jsonify(result), 200

@app.route('/publish_ride', methods=['POST'])
def publish_ride():
    data = request.get_json()
    mongo.db.inventory.insert_one(data)
    available_rides.append(data)

    return jsonify({'successs': True}), 200


if __name__ == '__main__':
    app.run(debug=True)
