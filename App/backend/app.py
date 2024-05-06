from flask import Flask, jsonify, request
from flask_pymongo import PyMongo
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
from flask_cors import CORS
from utils import decrypt, encrypt, check_intersection, aes_decrypt, aes_encrypt
import requests
import base64

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://umang:test1234@cluster0.hawp38e.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0"
mongo = PyMongo(app)
CORS(app)

# Generate RSA key pair
key = RSA.generate(2048)

keys = {
    "private_key": key.export_key().decode('utf-8'),
    "public_key": key.publickey().export_key().decode('utf-8')
}

# enlist the public key to 127.0.0.1:5050/upload_public_key
try:
    url = 'http://10.5.16.160:5050/upload_public_key'
    data = {'username': 'prot1_serv', 'public_key': keys['public_key']}
    response = requests.post(url, json=data)
    print(response.json())
except Exception as e:
    print('Error: Could not upload RSA public key to the key server => ', e)
    exit(1)

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
    req_key = decrypt(data['key'], keys['private_key'])
    req_iv = decrypt(data['iv'], keys['private_key'])
    email = aes_decrypt(data['email'], req_key, req_iv)

    coordinates = []
    for i in range(0, len(data["coordinates"])):
        coordinates.append((aes_decrypt(data["coordinates"][i]["lat"], req_key, req_iv),
                           aes_decrypt(data["coordinates"][i]["lng"], req_key, req_iv)))
        
    records = mongo.db.inventory.find()

    result = []

    for record in records:
        arr = []
        key = decrypt(record['key'], keys['private_key'])
        iv = decrypt(record['iv'], keys['private_key'])
        if aes_decrypt(record['email'], key, iv) != email:

            encrypted_arr = []

            for i in range(len(record['coordinates'])):
                arr.append((float(aes_decrypt(record['coordinates'][i]['lat'], key, iv)), float(aes_decrypt(record['coordinates'][i]['lng'], key, iv))))
                encrypted_arr.append([aes_encrypt(aes_decrypt(record['coordinates'][i]['lat'], key, iv), req_key, req_iv), 
                                      aes_encrypt(aes_decrypt(record['coordinates'][i]['lng'], key, iv), req_key, req_iv)])

            if check_intersection(coordinates, arr):
                res = {
                    "coordinates": encrypted_arr,
                    "name": aes_encrypt(aes_decrypt(record['name'], key, iv), req_key, req_iv),
                    "email": aes_encrypt(aes_decrypt(record['email'], key, iv), req_key, req_iv)
                }
                result.append(res)
                count += 1
    
    

    response = {"count": count, "routes": result}

    return jsonify(response), 200

@app.route('/publish_ride', methods=['POST'])
def publish_ride():
    data = request.get_json()
    mongo.db.inventory.insert_one(data)

    return jsonify({'successs': True}), 200


if __name__ == '__main__':
    app.run(debug=True)
