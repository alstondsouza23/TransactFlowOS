"""
Quick script to check what fields are actually stored in Firestore
for user Veena Bangera (or any user by email).
"""
import os, json
import firebase_admin
from firebase_admin import credentials, firestore, auth as fb_auth
from dotenv import load_dotenv

load_dotenv()
_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Check Veena Bangera
email = "veena.bangera@outlook.com"
try:
    user = fb_auth.get_user_by_email(email)
    uid  = user.uid
    print(f"UID for {email}: {uid}\n")

    doc = db.collection("users").document(uid).get()
    if doc.exists:
        data = doc.to_dict()
        print("Top-level keys in Firestore document:")
        for k in data.keys():
            print(f"  - {k}: {type(data[k]).__name__}")
        print("\nFull document (pretty-printed):")
        print(json.dumps(data, indent=2, default=str))
    else:
        print("Document does NOT exist in Firestore!")
except Exception as e:
    print(f"Error: {e}")
