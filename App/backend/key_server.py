from fastapi import FastAPI
from pydantic import BaseModel
import redis
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
rc = redis.Redis(host='127.0.0.1', port=6379)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set this to the appropriate origin or origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

class Item(BaseModel):
    username: str
    public_key: str

@app.get('/get_public_key')
async def get_public_key(username: str):
    public_key = rc.get(username)
    if public_key:
        return {'public_key': public_key.decode()}
    else:
        return {'error': 'Public key not found for the specified user'}

@app.post('/upload_public_key')
async def upload_public_key(item: Item):
    user = item.username
    public_key = item.public_key

    rc.set(user, public_key)

    return {'message': 'Public key uploaded successfully'}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5050)
