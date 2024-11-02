import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the API key from the environment variable
api_key = os.getenv('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')

# Define the endpoint and headers
url = 'https://api.example.com/endpoint'  # Replace with your API endpoint
headers = {
    'Authorization': f'Bearer {api_key}',  # Include the API key in the Authorization header
    'Content-Type': 'application/json'  # Optional: specify content type if needed
}

# Make the API request
response = requests.get(url, headers=headers)  # Use requests.post() for POST requests

# Check the response
if response.status_code == 200:
    print(response.json())  # Print the response JSON
else:
    print(f'Error: {response.status_code}, {response.text}')
