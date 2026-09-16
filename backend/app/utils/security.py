import hashlib
import hmac
import secrets


_ITERATIONS = 260_000


def hash_password(plain_password: str) -> str:
    """Hash a password with a random salt using PBKDF2-HMAC-SHA256.
    Stored as "salt_hex$hash_hex" - no external dependency required.
    """

    salt = secrets.token_hex(16)

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        plain_password.encode("utf-8"),
        bytes.fromhex(salt),
        _ITERATIONS,
    )

    return f"{salt}${derived.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify a plain password against a hash produced by hash_password."""

    if not stored_hash or "$" not in stored_hash:
        return False

    salt, expected_hex = stored_hash.split("$", 1)

    try:
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            bytes.fromhex(salt),
            _ITERATIONS,
        )
    except ValueError:
        return False

    return hmac.compare_digest(derived.hex(), expected_hex)
