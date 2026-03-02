"""Encryption utilities for sensitive data at rest.

Uses Fernet symmetric encryption (AES-128-CBC with HMAC-SHA256).
The encryption key is derived from the ENCRYPTION_KEY environment variable.
If not set, a key is auto-generated and persisted to .encryption_key in the
data directory.
"""

import base64
import hashlib
import logging
import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from reviewhound.config import Config

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _derive_key(secret: str) -> bytes:
    """Derive a 32-byte Fernet key from an arbitrary string."""
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def _get_key_path() -> Path:
    """Get the path for the auto-generated key file."""
    db_path = Path(Config.DATABASE_PATH)
    if db_path.is_absolute():
        return db_path.parent / ".encryption_key"
    return Path.cwd() / db_path.parent / ".encryption_key"


def _load_or_generate_key() -> bytes:
    """Load encryption key from env var or generate and persist one."""
    env_key = os.getenv("ENCRYPTION_KEY")
    if env_key:
        return _derive_key(env_key)

    key_path = _get_key_path()
    if key_path.exists():
        return key_path.read_bytes().strip()

    # Generate a new key and persist it
    key = Fernet.generate_key()
    key_path.parent.mkdir(parents=True, exist_ok=True)
    key_path.write_bytes(key)
    logger.info("Generated new encryption key at %s", key_path)
    return key


def get_fernet() -> Fernet:
    """Get the Fernet instance, initializing on first call."""
    global _fernet
    if _fernet is None:
        key = _load_or_generate_key()
        _fernet = Fernet(key)
    return _fernet


def reset_fernet() -> None:
    """Reset the cached Fernet instance. Used for testing."""
    global _fernet
    _fernet = None


def encrypt(plaintext: str) -> str:
    """Encrypt a string and return the base64-encoded ciphertext."""
    return get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a base64-encoded ciphertext string."""
    try:
        return get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt value — key may have changed")
        raise
