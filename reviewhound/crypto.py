"""Encryption utilities for sensitive data at rest.

Uses Fernet symmetric encryption (AES-128-CBC with HMAC-SHA256).

Key source (in priority order):
1. ENCRYPTION_KEY env var — PBKDF2-derived into a Fernet key (deterministic, portable)
2. Auto-generated via Fernet.generate_key() and persisted to .encryption_key
   alongside the database (random, machine-specific)
"""

import base64
import logging
import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from reviewhound.config import Config

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _derive_key(secret: str) -> bytes:
    """Derive a Fernet-compatible key (base64url-encoded) from an arbitrary string."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"reviewhound-encryption-v1",
        iterations=600_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(secret.encode()))


def _get_key_path() -> Path:
    """Get the path for the auto-generated key file (co-located with the database)."""
    db_path_str = Config.DATABASE_PATH
    if db_path_str == ":memory:":
        return Path.cwd() / ".encryption_key"
    db_path = Path(db_path_str)
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
        try:
            key_data = key_path.read_bytes().strip()
        except OSError as e:
            raise OSError(
                f"Cannot read encryption key file at {key_path}: {e}. "
                f"Check file permissions or set ENCRYPTION_KEY env var instead."
            ) from e
        if not key_data:
            raise ValueError(
                f"Encryption key file at {key_path} is empty. "
                f"Delete it to auto-generate a new key, or set ENCRYPTION_KEY env var."
            )
        return key_data

    # Generate a new key and persist it
    key = Fernet.generate_key()
    try:
        key_path.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        try:
            os.write(fd, key)
        finally:
            os.close(fd)
    except OSError as e:
        logger.warning(
            "Could not persist encryption key to %s: %s. "
            "Key will be regenerated on next startup. "
            "Set ENCRYPTION_KEY env var for stable key management.",
            key_path,
            e,
        )
    else:
        logger.info("Generated new encryption key at %s", key_path)
    return key


def get_fernet() -> Fernet:
    """Get the Fernet instance, initializing on first call."""
    global _fernet
    if _fernet is None:
        key = _load_or_generate_key()
        try:
            _fernet = Fernet(key)
        except ValueError as e:
            key_source = (
                "ENCRYPTION_KEY env var" if os.getenv("ENCRYPTION_KEY") else f"key file at {_get_key_path()}"
            )
            raise ValueError(
                f"Invalid encryption key from {key_source}: {e}. "
                f"Delete the key file to auto-generate a new one, "
                f"or set a valid ENCRYPTION_KEY environment variable."
            ) from e
    return _fernet


def reset_fernet() -> None:
    """Reset the cached Fernet instance. Used for testing."""
    global _fernet
    _fernet = None


def encrypt(plaintext: str) -> str:
    """Encrypt a string and return the Fernet token string."""
    return get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a Fernet token string."""
    try:
        return get_fernet().decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        logger.error(
            "Failed to decrypt value (length=%d, prefix=%s) — "
            "encryption key may have changed or data is corrupted",
            len(ciphertext),
            ciphertext[:10] + "..." if len(ciphertext) > 10 else ciphertext,
        )
        raise
