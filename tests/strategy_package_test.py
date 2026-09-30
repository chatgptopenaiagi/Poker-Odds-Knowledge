"""Release privacy/integrity checks; does not create a release or touch a profile."""
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location("package_strategy", Path(__file__).resolve().parents[1] / "scripts/package-strategy.py")
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


class PackagePolicy(unittest.TestCase):
    def test_private_files_excluded(self):
        for name in ("CLA_ACCEPTANCE.md", "docs/ENVIRONMENT.md", ".env", ".env.production",
                     ".pok-strategy/runtime.json", "artifacts/private.png", "node_modules/pkg/a.js",
                     "mobile/pok-android/android/local.properties", "backup.sqlite", "signing.jks",
                     "scripts/Deploy-Strategy-Preview.ps1"):
            self.assertTrue(pack.excluded(name), name)
        for name in (".env.example", "package-lock.json", "src/game.ts", "server/migrations/strategy-v1.sql",
                     "engine-adapters/java/notices/TexasHoldemSolverJava-MIT.txt"):
            self.assertFalse(pack.excluded(name), name)

    def test_secrets_and_user_paths_block_without_echo(self):
        data = b"key=sk-" + b"X" * 30 + b"\npath=C:" + bytes([92]) + b"Users\\someone\\private.json"
        findings = pack.audit_file("report.txt", data)
        self.assertEqual({x["kind"] for x in findings}, {"provider-token", "user-profile-path"})
        self.assertTrue(all(x["severity"] == "BLOCK" for x in findings))
        self.assertNotIn("someone", str(findings))
        self.assertNotIn("X" * 30, str(findings))

    def test_generic_addresses_and_reviewed_adversarial_uri(self):
        self.assertEqual(pack.audit_file("tests/a.ts", b"one@example.test two@example.com"), [])
        fixture = "mobile/pok-android/android/app/src/test/java/com/pok/study/BackupPolicyTest.java"
        self.assertEqual(pack.audit_file(fixture, b"https://evil" + b"@" + b"localhost.evil/"), [])
        self.assertEqual(pack.audit_file("report.md", b"private" + b"@" + b"somewhere.org")[0]["severity"], "BLOCK")

    def test_legal_contact_retained(self):
        findings = pack.audit_file("vendor/component/LICENSE.txt", b"Copyright author" + b"@" + b"upstream.org")
        self.assertEqual(findings[0]["severity"], "RETAINED_LEGAL_NOTICE")

    def test_machine_path_blocked_even_in_deployment_script(self):
        data = b"C:" + bytes([92]) + b"xampp\\htdocs\\dedicated-app"
        self.assertEqual(pack.audit_file("docs/record.md", data)[0]["severity"], "BLOCK")
        self.assertEqual(pack.audit_file("scripts/Deploy-Strategy-Preview.ps1", data)[0]["severity"], "BLOCK")

    def test_nested_runtime_is_scanned(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, "w") as archive:
            archive.writestr("assets/private.txt", b"-----BEGIN " + b"PRIVATE KEY-----")
        self.assertTrue(any(f["kind"] == "private-key" for f in pack.audit_nested("app.apk", data.getvalue())))

    def test_archive_path_validation_and_byte_integrity(self):
        for name in ("../secret", "C:/private", "/root/file", "a/../b"):
            with self.assertRaises(ValueError):
                pack.safe_name(name)
        with tempfile.TemporaryDirectory(prefix="pok-package-test-") as directory:
            path = Path(directory) / "reviewed.zip"
            record = pack.write_archive(path, {"nested/a.txt": "hello α".encode()}, (2026, 1, 1, 0, 0, 0))
            self.assertEqual(record["reopenedByteVerification"], "PASS")
            self.assertEqual(record["sha256"], pack.sha(path.read_bytes()))
            with self.assertRaises(FileExistsError):
                pack.write_archive(path, {}, (2026, 1, 1, 0, 0, 0))


if __name__ == "__main__":
    unittest.main()
