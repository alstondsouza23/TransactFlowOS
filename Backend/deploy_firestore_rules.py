"""
Backend/deploy_firestore_rules.py
===================================
Deploys firestore.rules to Firebase using the service account credentials.
No Firebase CLI required.

Usage (run from Backend/ directory):
    python deploy_firestore_rules.py

The script uses the Firebase Management REST API with the service account
to create a new ruleset and make it the active release for Firestore.
"""

import os
import sys
import json
import requests

# ── Resolve paths ──────────────────────────────────────────────────────────
BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR     = os.path.dirname(BACKEND_DIR)
RULES_PATH   = os.path.join(ROOT_DIR, "firestore.rules")
SA_KEY_PATH  = os.path.join(BACKEND_DIR, "serviceAccountKey.json")

if not os.path.exists(SA_KEY_PATH):
    print("[ERROR] serviceAccountKey.json not found in Backend/")
    sys.exit(1)

if not os.path.exists(RULES_PATH):
    print("[ERROR] firestore.rules not found in project root:", RULES_PATH)
    sys.exit(1)

# ── Read project ID from service account ───────────────────────────────────
with open(SA_KEY_PATH) as f:
    sa = json.load(f)

PROJECT_ID = sa["project_id"]
print("[*] Project ID:", PROJECT_ID)

# ── Get OAuth2 access token from service account ───────────────────────────
try:
    import google.auth.transport.requests
    import google.oauth2.service_account
except ImportError:
    print("[*] Installing google-auth...")
    os.system(f"{sys.executable} -m pip install google-auth -q")
    import google.auth.transport.requests
    import google.oauth2.service_account

SCOPES = ["https://www.googleapis.com/auth/firebase"]

credentials = google.oauth2.service_account.Credentials.from_service_account_file(
    SA_KEY_PATH, scopes=SCOPES
)
credentials.refresh(google.auth.transport.requests.Request())
access_token = credentials.token

HEADERS = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type":  "application/json",
}

# ── Read the rules file ────────────────────────────────────────────────────
with open(RULES_PATH, "r") as f:
    rules_content = f.read()

print("[*] Loaded rules from:", RULES_PATH)
print("    ({} bytes)".format(len(rules_content)))

# ── Step 1: Create a new ruleset ──────────────────────────────────────────
SEP = "-" * 54
create_url = f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets"

body = {
    "source": {
        "files": [
            {
                "name":    "firestore.rules",
                "content": rules_content,
            }
        ]
    }
}

print("")
print(SEP)
print("  Step 1: Creating new ruleset...")
print(SEP)

resp = requests.post(create_url, headers=HEADERS, json=body)
if resp.status_code != 200:
    print("[ERROR] Failed to create ruleset:")
    print("  Status:", resp.status_code)
    print("  Body:  ", resp.text)
    sys.exit(1)

ruleset_name = resp.json()["name"]
print("  [ok] Ruleset created:", ruleset_name)

# ── Step 2: Update the Firestore release to use the new ruleset ───────────
release_name = f"projects/{PROJECT_ID}/releases/cloud.firestore"
release_url  = f"https://firebaserules.googleapis.com/v1/{release_name}"

print("")
print(SEP)
print("  Step 2: Updating Firestore release...")
print(SEP)

update_body = {
    "release": {
        "name":        release_name,
        "rulesetName": ruleset_name,
    }
}

resp2 = requests.put(release_url, headers=HEADERS, json=update_body)
if resp2.status_code == 404:
    # Release doesn't exist yet — create it instead
    create_release_url = f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases"
    resp2 = requests.post(
        create_release_url,
        headers=HEADERS,
        json={"release": {"name": release_name, "rulesetName": ruleset_name}}
    )

if resp2.status_code not in (200, 201):
    print("[ERROR] Failed to update release:")
    print("  Status:", resp2.status_code)
    print("  Body:  ", resp2.text)
    sys.exit(1)

print("  [ok] Release updated successfully")
print("")
print(SEP)
print("  Firestore rules deployed!")
print("  Project:", PROJECT_ID)
print("  Ruleset:", ruleset_name)
print(SEP)
print("")
print("  The employee can now read the users collection.")
print("  The KYC Approvals queue will populate immediately.")
print("")
