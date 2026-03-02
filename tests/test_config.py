"""Tests for reviewhound.config module."""

from unittest.mock import patch

from reviewhound.config import Config


class TestGetDatabaseUrl:
    """Tests for Config.get_database_url."""

    def test_memory_database(self):
        """Should handle :memory: database."""
        with patch.object(Config, "DATABASE_PATH", ":memory:"):
            url = Config.get_database_url()
            assert url == "sqlite:///:memory:"

    def test_relative_path_resolved_to_cwd(self, tmp_path, monkeypatch):
        """Should resolve relative path against cwd."""
        monkeypatch.chdir(tmp_path)
        with patch.object(Config, "DATABASE_PATH", "data/reviews.db"):
            url = Config.get_database_url()
            assert url == f"sqlite:///{tmp_path}/data/reviews.db"
            # Should have created parent directory
            assert (tmp_path / "data").is_dir()

    def test_absolute_path_used_directly(self, tmp_path):
        """Should use absolute path without modification."""
        db_path = str(tmp_path / "data" / "reviews.db")
        with patch.object(Config, "DATABASE_PATH", db_path):
            url = Config.get_database_url()
            assert url == f"sqlite:///{db_path}"
            # Should have created parent directory
            assert (tmp_path / "data").is_dir()
