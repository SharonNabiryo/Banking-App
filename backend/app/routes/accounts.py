from flask import Blueprint, request
from flask_jwt_extended import current_user, jwt_required

from .. import services
from ..banking import COIN_VALUES
from ..extensions import db
from .helpers import body, int_arg

bp = Blueprint("accounts", __name__, url_prefix="/api")


@bp.get("/accounts")
@jwt_required()
def list_accounts():
    include_closed = request.args.get("all") == "1"
    accounts = [a for a in current_user.accounts if include_closed or a.status == "open"]
    return {"accounts": [a.to_dict() for a in accounts]}


@bp.post("/accounts")
@jwt_required()
def open_account():
    data = body()
    account, pin = services.open_account(
        current_user, data.get("nickname"), data.get("kind"), data.get("openingDeposit")
    )
    # The PIN is only ever revealed once, right after the account is created.
    return {"account": account.to_dict(), "pin": pin}, 201


@bp.get("/accounts/<number>")
@jwt_required()
def get_account(number):
    account = services.get_owned_account(current_user, number, include_closed=True)
    return {"account": account.to_dict(include_owner=True)}


@bp.patch("/accounts/<number>")
@jwt_required()
def rename_account(number):
    account = services.get_owned_account(current_user, number)
    nickname = str(body().get("nickname") or "").strip()
    if nickname:
        account.nickname = nickname[:60]
        db.session.commit()
    return {"account": account.to_dict()}


@bp.post("/accounts/<number>/close")
@jwt_required()
def close_account(number):
    account = services.get_owned_account(current_user, number)
    services.close_account(account, body().get("pin"))
    return {"account": account.to_dict()}


@bp.put("/accounts/<number>/pin")
@jwt_required()
def change_pin(number):
    data = body()
    account = services.get_owned_account(current_user, number)
    services.change_pin(account, data.get("currentPin"), data.get("newPin"), data.get("confirmPin"))
    return {"message": "PIN updated"}


@bp.post("/accounts/<number>/deposit")
@jwt_required()
def deposit(number):
    data = body()
    account = services.get_owned_account(current_user, number)
    tx = services.deposit(account, data.get("amount"), data.get("memo"))
    return {"account": account.to_dict(), "transaction": tx.to_dict()}


@bp.post("/accounts/<number>/withdraw")
@jwt_required()
def withdraw(number):
    data = body()
    account = services.get_owned_account(current_user, number)
    tx = services.withdraw(account, data.get("amount"), data.get("pin"), data.get("memo"))
    return {"account": account.to_dict(), "transaction": tx.to_dict()}


@bp.post("/accounts/<number>/atm")
@jwt_required()
def atm(number):
    data = body()
    account = services.get_owned_account(current_user, number)
    tx, bills = services.atm_withdraw(account, data.get("amount"), data.get("pin"))
    return {"account": account.to_dict(), "transaction": tx.to_dict(), "bills": bills}


@bp.post("/accounts/<number>/coins")
@jwt_required()
def coins(number):
    account = services.get_owned_account(current_user, number)
    tx, invalid = services.deposit_coins(account, body().get("coins"))
    return {"account": account.to_dict(), "transaction": tx.to_dict(), "invalid": invalid}


@bp.get("/coins")
def coin_values():
    return {"coins": COIN_VALUES}


@bp.get("/accounts/<number>/transactions")
@jwt_required()
def account_transactions(number):
    account = services.get_owned_account(current_user, number, include_closed=True)
    rows, total = services.list_transactions(
        [account.id], int_arg("limit", 25, 1), int_arg("offset", 0, 0, 10**6), request.args.get("kind")
    )
    return {"transactions": [t.to_dict() for t in rows], "total": total}


@bp.get("/transactions")
@jwt_required()
def all_transactions():
    rows, total = services.list_transactions(
        [a.id for a in current_user.accounts],
        int_arg("limit", 25, 1), int_arg("offset", 0, 0, 10**6), request.args.get("kind"),
    )
    return {"transactions": [t.to_dict() for t in rows], "total": total}


@bp.post("/transfers")
@jwt_required()
def transfer():
    data = body()
    tx, source, target = services.transfer(
        current_user, data.get("from"), data.get("to"), data.get("amount"), data.get("pin"), data.get("memo")
    )
    return {"transaction": tx.to_dict(), "from": source.to_dict(),
            "to": {"number": target.number, "balanceCents": target.balance_cents}
            if target.user_id == current_user.id else {"number": target.number}}


@bp.get("/recipients/<number>")
@jwt_required()
def lookup_recipient(number):
    """Confirm who a transfer is going to before sending it (first name + last initial only)."""
    account = services.find_open_account(number)
    return {"number": account.number,
            "name": f"{account.owner.first_name} {account.owner.last_name[:1]}.",
            "own": account.user_id == current_user.id}


@bp.get("/summary")
@jwt_required()
def summary():
    return services.summary(current_user, int_arg("days", 30, 7, 365))
