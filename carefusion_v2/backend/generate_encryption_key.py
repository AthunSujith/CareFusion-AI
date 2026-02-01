"""
Generate master encryption key for document storage
Run this ONCE and add the key to your .env file
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def generate_master_key():
    """Generate a new 256-bit master encryption key"""
    key = AESGCM.generate_key(bit_length=256)
    return base64.b64encode(key).decode('utf-8')

if __name__ == "__main__":
    key = generate_master_key()
    print("\n" + "="*70)
    print("MASTER ENCRYPTION KEY GENERATED")
    print("="*70)
    print("\nAdd this to your .env file:")
    print(f"\nDOCUMENT_ENCRYPTION_KEY={key}")
    print("\n" + "="*70)
    print("⚠️  KEEP THIS SECRET - Never commit to Git!")
    print("="*70 + "\n")
