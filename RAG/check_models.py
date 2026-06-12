import httpx, json, sys
sys.path.insert(0, '.')
from config import GEMINI_API_KEY

for model_id in ['gemini-embedding-001', 'gemini-embedding-2-preview', 'gemini-embedding-2']:
    r = httpx.get(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model_id}',
        headers={'x-goog-api-key': GEMINI_API_KEY}, timeout=10
    )
    if r.status_code == 200:
        info = r.json()
        dims = info.get('outputDimensionality')
        methods = info.get('supportedGenerationMethods')
        print(f"{model_id}: dims={dims}, methods={methods}")
    else:
        print(f"{model_id}: HTTP {r.status_code}")
