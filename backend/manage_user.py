"""Grant a registered account investigation or admin permissions."""

import argparse

from app import create_app
from database import get_connection


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email", help="Email address of an existing account")
    parser.add_argument("role", choices=("citizen", "officer", "admin"))
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        with get_connection() as conn:
            result = conn.execute(
                "UPDATE users SET role = ? WHERE email = ?",
                (args.role, args.email.strip().lower()),
            )
            if result.rowcount != 1:
                parser.error("No account exists for that email; register it first.")
    print(f"Updated {args.email} to role {args.role}.")


if __name__ == "__main__":
    main()
