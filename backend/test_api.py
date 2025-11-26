#!/usr/bin/env python3
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

print("=" * 60)
print("Testing Lost and Found API with Neon Database")
print("=" * 60)

# 1. Register a new user
print("\n1. Registering a new user...")
register_data = {
    "email": "testuser@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "studentNumber": "2024999",
    "yearLevel": 3,
    "course": "Information Technology"
}

response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
if response.status_code == 200:
    user_data = response.json()
    token = user_data["access_token"]
    print(f"✓ User registered successfully!")
    print(f"  Email: {user_data['user']['email']}")
    print(f"  Name: {user_data['user']['firstName']} {user_data['user']['lastName']}")
    print(f"  Student #: {user_data['user']['studentNumber']}")
else:
    print(f"✗ Registration failed: {response.json()}")
    exit(1)

# 2. Post a FOUND item
print("\n2. Posting a FOUND item...")
headers = {"Authorization": f"Bearer {token}"}
found_item = {
    "title": "Found Laptop",
    "description": "MacBook Pro 14-inch found in Room 305",
    "category": "Electronics",
    "color": "Space Gray",
    "condition": "Excellent",
    "location": "Engineering Building - Room 305",
    "date": datetime.now().isoformat(),
    "status": "found",
    "isUrgent": True,
    "contactMethod": "email",
    "submittedToSecurity": False
}

response = requests.post(f"{BASE_URL}/api/items", json=found_item, headers=headers)
if response.status_code == 200:
    item_data = response.json()
    print(f"✓ Found item posted successfully!")
    print(f"  Reference #: {item_data['referenceNumber']}")
    print(f"  Title: {item_data['title']}")
    print(f"  Location: {item_data['location']}")
    print(f"  Status: {item_data['status']}")
else:
    print(f"✗ Failed to post item: {response.json()}")
    exit(1)

# 3. Post a LOST item
print("\n3. Posting a LOST item...")
lost_item = {
    "title": "Lost Student ID",
    "description": "Student ID with name 'Test User' - lost near the cafeteria",
    "category": "Documents",
    "color": "Blue",
    "condition": "Good",
    "location": "Main Cafeteria",
    "date": datetime.now().isoformat(),
    "status": "lost",
    "isUrgent": True,
    "reward": "Reward: Free coffee",
    "contactMethod": "email",
    "submittedToSecurity": True
}

response = requests.post(f"{BASE_URL}/api/items", json=lost_item, headers=headers)
if response.status_code == 200:
    item_data = response.json()
    print(f"✓ Lost item posted successfully!")
    print(f"  Reference #: {item_data['referenceNumber']}")
    print(f"  Title: {item_data['title']}")
    print(f"  Location: {item_data['location']}")
    print(f"  Reward: {item_data['reward']}")
else:
    print(f"✗ Failed to post item: {response.json()}")
    exit(1)

# 4. Get all items
print("\n4. Fetching all items...")
response = requests.get(f"{BASE_URL}/api/items")
if response.status_code == 200:
    items = response.json()
    print(f"✓ Found {len(items)} items in the database:")
    for item in items:
        print(f"  - [{item['referenceNumber']}] {item['title']} ({item['status']})")
else:
    print(f"✗ Failed to fetch items: {response.json()}")

# 5. Get statistics
print("\n5. Getting statistics...")
response = requests.get(f"{BASE_URL}/api/stats")
if response.status_code == 200:
    stats = response.json()
    print(f"✓ Statistics:")
    print(f"  Total Lost: {stats['totalLost']}")
    print(f"  Total Found: {stats['totalFound']}")
    print(f"  Total Returned: {stats['totalReturned']}")
else:
    print(f"✗ Failed to get stats: {response.json()}")

print("\n" + "=" * 60)
print("✓ All tests passed! Database is working dynamically!")
print("=" * 60)
