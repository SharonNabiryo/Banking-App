import click
from sqlalchemy import select

from . import services
from .extensions import db
from .models import User


def register_cli(app):
    @app.cli.command("make-admin")
    @click.argument("email")
    def make_admin(email):
        """Give an existing user administrator access."""
        user = db.session.scalar(select(User).where(User.email == email.strip().lower()))
        if not user:
            raise click.ClickException(f"No user with email {email}")
        user.is_admin = True
        db.session.commit()
        click.echo(f"{user.email} is now an administrator.")

    @app.cli.command("seed")
    def seed():
        """Create demo users with fictional data."""
        demo = [
            ("admin@copperleaf.test", "Ada", "Admin", "999000001", True),
            ("jane@copperleaf.test", "Jane", "Doe", "999000002", False),
        ]
        for email, first, last, ssn, is_admin in demo:
            if db.session.scalar(select(User).where(User.email == email)):
                click.echo(f"{email} already exists, skipping")
                continue
            user = services.register_user(email, "password123", first, last, ssn)
            user.is_admin = is_admin
            checking, pin1 = services.open_account(user, "Everyday", "checking", "1250.00")
            savings, pin2 = services.open_account(user, "Rainy day", "savings", "5000.00")
            services.deposit_coins(checking, "QQQQDDNNPPPW")
            click.echo(f"{email} / password123  checking {checking.number} PIN {pin1}"
                       f"  savings {savings.number} PIN {pin2}")
