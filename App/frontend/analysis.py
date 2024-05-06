import aiohttp
import asyncio
import json
import requests
import time
import os
from utils import aes_decrypt, aes_encrypt, encrypt, decrypt

import random
import string

def generate_random_email(domain=None, length=7):
    """Generate a random email address."""
    # Define characters to use for the local part of the email
    chars = string.ascii_letters + string.digits + '_'
    
    # Generate a random sequence of characters for the local part
    local_part = ''.join(random.choice(chars) for _ in range(length))
    
    # Specify a domain if none is provided
    if domain is None:
        domains = ["example.com", "test.com", "demo.org", "sample.net"]
        domain = random.choice(domains)
    
    # Construct the email
    email = f"{local_part}@{domain}"
    return email

def generate_route(start_lat, start_lon, num_points, lat_variation=0.01, lon_variation=0.01):
    """
    Generate a series of geographic coordinates to simulate a route.

    Parameters:
    - start_lat (float): Starting latitude
    - start_lon (float): Starting longitude
    - num_points (int): Number of coordinates to generate
    - lat_variation (float): Maximum variation in latitude between points
    - lon_variation (float): Maximum variation in longitude between points

    Returns:
    - List of tuples, where each tuple is a coordinate (latitude, longitude)
    """
    route = [(start_lat, start_lon)]
    current_lat, current_lon = start_lat, start_lon

    for _ in range(num_points - 1):
        # Generate next point by adding a small random number to the current latitude and longitude
        next_lat = current_lat + random.uniform(-lat_variation, lat_variation)
        next_lon = current_lon + random.uniform(-lon_variation, lon_variation)
        route.append((next_lat, next_lon))
        current_lat, current_lon = next_lat, next_lon

    return route 


elapsed_time = 0

# fetch RSA key from key server running on localhost:5050
try:
    url = 'http://10.5.16.160:5050/get_public_key'
    username = 'prot1_serv'
    response = requests.get(url, params={'username': username})
    public_key = response.json()['public_key']
except:
    print('Error: Could not fetch RSA public key from the key server')
    exit(1)

async def fetch(session, url, data):
    async with session.post(url, json=data) as response:
        return await response.text()

async def make_requests(url, num_requests):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for _ in range(num_requests):
            st = time.time()
            start_latitude = 40.7128  # Example: New York City latitude
            start_longitude = -74.0060  # Example: New York City longitude
            number_of_points = random.randint(0, 400)  # Number of coordinates in the route
            key = os.urandom(16)
            iv = os.urandom(16)
            data = {
                "coordinates": generate_route(start_latitude, start_longitude, number_of_points),
                "email": aes_encrypt(generate_random_email(), key, iv),
                "name": aes_encrypt(generate_random_email(), key, iv),
                "key": encrypt(public_key, key),
                "iv": encrypt(public_key, iv)
            }

            for i in range(len(data['coordinates'])):
                data["coordinates"][i] = (aes_encrypt(string(data["coordinates"][i][0]), key, iv), aes_encrypt(string(data["coordinates"][i][1]), key, iv))
            et = time.time()

            elapsed_time -= (et - st)
            tasks.append(fetch(session, url, data))
        responses = await asyncio.gather(*tasks)
        return responses

async def main():
    url = "http://10.5.16.160:5000/publish_ride"  # Replace with the actual URL you need to request
    num_requests = 1000  # Number of concurrent requests
    sample_data = {"key": "value", "another_key": "another_value"}  # Example data

    # Start timer
    start_time = time.time()

    responses = await make_requests(url, num_requests)

    # End timer
    end_time = time.time()

    # Calculate elapsed time
    elapsed_time += (end_time - start_time)
    throughput = num_requests / elapsed_time  # Requests per second

    print(f"Completed {len(responses)} requests.")
    print(f"Elapsed Time: {elapsed_time:.2f} seconds")
    print(f"Throughput: {throughput:.2f} requests per second")

if __name__ == "__main__":
    asyncio.run(main())
