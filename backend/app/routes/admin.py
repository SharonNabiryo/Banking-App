from flask import Blueprint, request
from sqlalchemy import select

from .. import services
from ..extensions import db
from ..models import Account
from .helpers import admin_required, body

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.get("/stats")
@admin_required
def stats():
    return services.bank_stats()


@bp.get("/accounts")
@admin_required
def accounts():
    """BankManager option 11: print all existing accounts."""
    query = select(Account).order_by(Account.created_at.desc())
    if request.args.get("all") != "1":
        query = query.where(Account.status == "open")
    return {"accounts": [a.to_dict(include_owner=True) for a in db.session.scalars(query)]}


@bp.post("/interest")
@admin_required
def interest():
    """BankManager option 10: add monthly interest to all accounts."""
    return services.apply_monthly_interest(body().get("annualRate"))
