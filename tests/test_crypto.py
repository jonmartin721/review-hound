"""Tests for reviewhound.crypto module."""

import os
from unittest.mock import patch

import pytest

from reviewhound.crypto import decrypt, encrypt, reset_fernet


@pytest.fixture(autouse=True)
def _clean_fernet():
    """Reset Fernet state between tests."""
    reset_fernet()
    yield
    reset_fernet()


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
        from cryptography.fernet import InvalidToken

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
        config.api_key = "will-be-encrypted"
        # Overwrite the raw column with plaintext to simulate a pre-encryption DB
        object.__setattr__(config, "_api_key_encrypted", "plaintext-old-key")
        # Should return the plaintext value (not crash)
        assert config.api_key == "plaintext-old-key"
