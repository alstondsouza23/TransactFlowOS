import sys

file_path = "c:\\Web_dev\\TransactFlowOS\\Backend\\handlers\\auction.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

new_decl = """def _db():
    from firebase_admin import firestore as fa_firestore
    return fa_firestore.client()"""

# Replace the top db definition
content = content.replace("db  = fa_firestore.client()", new_decl)

# Replace all usages of db.collection with _db().collection
content = content.replace("db.collection", "_db().collection")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
