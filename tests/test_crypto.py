"""Tests for reviewhound.crypto module."""

import os
import stat
from pathlib import Path
from unittest.mock import patch

import pytest
from cryptography.fernet import Fernet, InvalidToken

from reviewhound.crypto import (
    _derive_key,
    _get_key_path,
    decrypt,
    encrypt,
    get_fernet,
    reset_fernet,
)


@pytest.fixture(autouse=True)
def _clean_fernet():
    """Reset Fernet state between tests."""
    reset_fernet()
    yield
    reset_fernet()


class TestDeriveKey:
    """Tests for PBKDF2 key derivation."""

    def test_deterministic(self):
        """Same secret must always produce the same key."""
        k1 = _derive_key("my-secret")
        k2 = _derive_key("my-secret")
        assert k1 == k2

    def test_different_secrets_differ(self):
        """Different secrets must produce different keys."""
        k1 = _derive_key("secret-a")
        k2 = _derive_key("secret-b")
        assert k1 != k2

    def test_produces_valid_fernet_key(self):
        """Derived key must be accepted by Fernet constructor."""
        key = _derive_key("any-string")
        Fernet(key)  # should not raise


class TestGetKeyPath:
    """Tests for _get_key_path with different DATABASE_PATH values."""

    def test_absolute_database_path(self):
        """Should place key file alongside an absolute database path."""
        with patch("reviewhound.crypto.Config") as mock_config:
            mock_config.DATABASE_PATH = "/var/data/reviews.db"
            assert _get_key_path() == Path("/var/data/.encryption_key")

    def test_relative_database_path(self):
        """Should resolve relative path against cwd."""
        with patch("reviewhound.crypto.Config") as mock_config:
            mock_config.DATABASE_PATH = "data/reviews.db"
            assert _get_key_path() == Path.cwd() / "data" / ".encryption_key"

    def test_memory_database(self):
        """Should fall back to cwd for :memory: databases."""
        with patch("reviewhound.crypto.Config") as mock_config:
            mock_config.DATABASE_PATH = ":memory:"
            assert _get_key_path() == Path.cwd() / ".encryption_key"


class TestEncryptDecrypt:
    """Tests for encrypt/decrypt round-trip."""

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-secret-key"})
    def test_round_trip(self):
        """Encrypted value should decrypt to original."""
        plaintext = "sk-abc123-my-api-key"
        ciphertext = encrypt(plaintext)
        assert ciphertext != plaintext
        assert decrypt(ciphertext) == plaintext

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-secret-key"})
    def test_different_plaintexts_produce_different_ciphertexts(self):
        """Two different values should not produce the same ciphertext."""
        a = encrypt("key-one")
        b = encrypt("key-two")
        assert a != b

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-secret-key"})
    def test_same_plaintext_produces_different_ciphertexts(self):
        """Fernet uses random IVs, so same input should vary."""
        a = encrypt("same-key")
        b = encrypt("same-key")
        assert a != b
        assert decrypt(a) == decrypt(b)

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "key-a"})
    def test_wrong_key_raises(self):
        """Decrypting with a different key should fail."""
        ciphertext = encrypt("secret")
        reset_fernet()

        with patch.dict(os.environ, {"ENCRYPTION_KEY": "key-b"}), pytest.raises(InvalidToken):
            decrypt(ciphertext)

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-key"})
    def test_handles_unicode(self):
        """Should handle non-ASCII characters."""
        plaintext = "api-key-with-émojis-🔑"
        assert decrypt(encrypt(plaintext)) == plaintext

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-key"})
    def test_handles_empty_string(self):
        """Should handle empty string."""
        assert decrypt(encrypt("")) == ""

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-key"})
    def test_garbled_ciphertext_raises(self):
        """Garbled ciphertext should raise InvalidToken."""
        with pytest.raises(InvalidToken):
            decrypt("this-is-not-valid-ciphertext")


class TestKeyFileGeneration:
    """Tests for auto-generated key file when ENCRYPTION_KEY is unset."""

    def test_generates_key_file(self, tmp_path, monkeypatch):
        """Without ENCRYPTION_KEY, should generate and persist a key file."""
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
        monkeypatch.setattr("reviewhound.crypto.Config.DATABASE_PATH", str(tmp_path / "data" / "test.db"))

        ct = encrypt("test-value")
        key_path = tmp_path / "data" / ".encryption_key"
        assert key_path.exists()

        # Key file should contain valid Fernet key
        Fernet(key_path.read_bytes().strip())

        # Reset and decrypt — proves the persisted key is reused
        reset_fernet()
        assert decrypt(ct) == "test-value"

    def test_reads_existing_key_file(self, tmp_path, monkeypatch):
        """Should load from existing key file, not generate a new one."""
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)

        key = Fernet.generate_key()
        key_path = tmp_path / ".encryption_key"
        key_path.write_bytes(key)

        monkeypatch.setattr("reviewhound.crypto.Config.DATABASE_PATH", str(tmp_path / "test.db"))

        f = get_fernet()
        ct = f.encrypt(b"check")
        assert Fernet(key).decrypt(ct) == b"check"

    def test_key_file_permissions(self, tmp_path, monkeypatch):
        """Auto-generated key file should be owner-only (0600)."""
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
        monkeypatch.setattr("reviewhound.crypto.Config.DATABASE_PATH", str(tmp_path / "test.db"))

        encrypt("trigger-generation")
        key_path = tmp_path / ".encryption_key"
        mode = key_path.stat().st_mode
        assert mode & stat.S_IRWXG == 0, "Group should have no permissions"
        assert mode & stat.S_IRWXO == 0, "Other should have no permissions"

    def test_empty_key_file_raises(self, tmp_path, monkeypatch):
        """Empty key file should raise with actionable message."""
        monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
        key_path = tmp_path / ".encryption_key"
        key_path.write_bytes(b"")

        monkeypatch.setattr("reviewhound.crypto.Config.DATABASE_PATH", str(tmp_path / "test.db"))

        with pytest.raises(ValueError, match="empty"):
            encrypt("anything")


class TestAPIConfigEncryption:
    """Tests for APIConfig model encryption integration."""

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-model-key", "DATABASE_PATH": ":memory:"})
    def test_api_key_stored_encrypted(self):
        """API key should be encrypted in the database column."""
        from reviewhound.models import APIConfig

        config = APIConfig(provider="google_places", enabled=True)
        config.api_key = "my-secret-api-key"

        # The raw column value should be encrypted (not plaintext)
        assert config._api_key_encrypted != "my-secret-api-key"
        # But the property should return plaintext
        assert config.api_key == "my-secret-api-key"

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-model-key", "DATABASE_PATH": ":memory:"})
    def test_mask_key_still_works(self):
        """mask_key should work with decrypted key values."""
        from reviewhound.models import APIConfig

        assert APIConfig.mask_key("abcd1234efgh5678") == "abcd****5678"
        assert APIConfig.mask_key("short") == "****"
        assert APIConfig.mask_key("") == "****"

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-model-key", "DATABASE_PATH": ":memory:"})
    def test_plaintext_fallback(self):
        """Should fall back to plaintext for pre-encryption keys."""
        from reviewhound.models import APIConfig

        config = APIConfig(provider="test", enabled=True)
        # Set raw column directly to simulate a pre-encryption DB value
        object.__setattr__(config, "_api_key_encrypted", "plaintext-old-key")
        # Should return the plaintext value (not crash)
        assert config.api_key == "plaintext-old-key"

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test-model-key", "DATABASE_PATH": ":memory:"})
    def test_api_key_returns_empty_when_not_set(self):
        """Should return empty string when no key has been stored."""
        from reviewhound.models import APIConfig

        config = APIConfig(provider="test", enabled=True)
        assert config.api_key == ""

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "key-a", "DATABASE_PATH": ":memory:"})
    def test_wrong_key_raises_on_encrypted_value(self):
        """Should raise when decryption fails on a Fernet-looking value."""
        from reviewhound.models import APIConfig

        config = APIConfig(provider="test", enabled=True)
        config.api_key = "my-secret"

        # Switch encryption key
        reset_fernet()
        with patch.dict(os.environ, {"ENCRYPTION_KEY": "key-b"}), pytest.raises(InvalidToken):
            _ = config.api_key
