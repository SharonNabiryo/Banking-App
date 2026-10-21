"""Database-backed banking operations (the web equivalent of Bank + BankManager)."""
from datetime import timedelta

from flask import current_app
from sqlalchemy import func, select

from . import banking
from .banking import BankingError
from .extensions import db
from .models import Account, Transaction, User, utcnow

ACCOUNT_KINDS = {"checking", "savings"}


def _record(account, kind, amount_cents, counterparty=None, memo=None, details=None):
    tx = Transaction(
        account=account,
        kind=kind,
        amount_cents=amount_cents,
        balance_after_cents=account.balance_cents,
        counterparty=counterparty,
        memo=memo,
        details=details,
    )
    db.session.add(tx)
    return tx


# ---------------------------------------------------------------- users

def register_user(email, password, first_name, last_name, ssn):
    email = str(email or "").strip().lower()
    first_name = str(first_name or "").strip()
    last_name = str(last_name or "").strip()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise BankingError("Enter a valid email address.")
    if len(str(password or "")) < 8:
        raise BankingError("Password must be at least 8 characters.")
    if not first_name or not last_name:
        raise BankingError("First and last name are required.")
    ssn = banking.validate_ssn(ssn)
    ssn_hash = banking.hash_ssn(ssn, current_app.config["SECRET_KEY"])

    if db.session.scalar(select(User).where(User.email == email)):
        raise BankingError("An account with that email already exists.", 409)
    # Bank.isDuplicateSSN
    if db.session.scalar(select(User).where(User.ssn_hash == ssn_hash)):
        raise BankingError("That SSN is already registered.", 409)

    user = User(
        email=email,
        # Account.setOwnerFirstName / setOwnerLastName capitalize names
        first_name=first_name[:80].capitalize(),
        last_name=last_name[:80].capitalize(),
        ssn_hash=ssn_hash,
        ssn_last4=ssn[-4:],
        is_admin=email in current_app.config["ADMIN_EMAILS"],
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email, password):
    email = str(email or "").strip().lower()
    user = db.session.scalar(select(User).where(User.email == email))
    if not user or not user.check_password(str(password or "")):
        raise BankingError("Incorrect email or password.", 401)
    return user


# ---------------------------------------------------------------- accounts

def open_account_count():
    return db.session.scalar(select(func.count(Account.id)).where(Account.status == "open"))


def open_account(user, nickname=None, kind="checking", opening_deposit=None):
    kind = (kind or "checking").lower()
    if kind not in ACCOUNT_KINDS:
        raise BankingError("Account type must be checking or savings.")
    # Bank.addAccountToBank: the bank holds a fixed number of accounts.
    if open_account_count() >= current_app.config["MAX_ACCOUNTS"]:
        raise BankingError("The bank is full. No more accounts can be created.", 409)

    number = banking.generate_account_number()
    while db.session.scalar(select(Account.id).where(Account.number == number)):
        number = banking.generate_account_number()

    pin = banking.generate_pin()
    account = Account(
        number=number,
        owner=user,
        nickname=(str(nickname or "").strip() or f"{kind.capitalize()}")[:60],
        kind=kind,
        balance_cents=0,
    )
    account.set_pin(pin)
    db.session.add(account)
    _record(account, "opened", 0, memo="Account opened")

    if opening_deposit not in (None, "", 0, "0"):
        cents = banking.parse_amount(opening_deposit)
        account.balance_cents += cents
        _record(account, "deposit", cents, memo="Opening deposit")

    db.session.commit()
    return account, pin


def get_owned_account(user, number, include_closed=False):
    try:
        number = int(number)
    except (TypeError, ValueError):
        raise BankingError("Account not found.", 404)
    account = db.session.scalar(
        select(Account).where(Account.number == number, Account.user_id == user.id)
    )
    if not account or (account.status != "open" and not include_closed):
        raise BankingError("Account not found.", 404)
    return account


def verify_pin(account, pin):
    """BankManager.promptForAccountNumberAndPIN, with a lockout instead of an endless retry loop."""
    now = utcnow()
    locked_until = account.locked_until
    if locked_until is not None and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=now.tzinfo)
    if locked_until and locked_until > now:
        minutes = max(1, int((locked_until - now).total_seconds() // 60) + 1)
        raise BankingError(f"Too many incorrect PINs. Try again in {minutes} min.", 423)

    if account.check_pin(str(pin or "").strip()):
        account.failed_pin_attempts = 0
        account.locked_until = None
        return

    account.failed_pin_attempts += 1
    remaining = current_app.config["MAX_PIN_ATTEMPTS"] - account.failed_pin_attempts
    if remaining <= 0:
        account.failed_pin_attempts = 0
        account.locked_until = now + timedelta(minutes=current_app.config["PIN_LOCK_MINUTES"])
        db.session.commit()
        raise BankingError("Too many incorrect PINs. The account is locked for 15 minutes.", 423)
    db.session.commit()
    raise BankingError(f"Invalid PIN. {remaining} attempt{'s' if remaining != 1 else ''} left.", 403)


def change_pin(account, current_pin, new_pin, confirm_pin):
    verify_pin(account, current_pin)
    new_pin = banking.validate_pin(new_pin)
    if str(confirm_pin or "").strip() != new_pin:
        raise BankingError("PINs do not match, try again.")
    account.set_pin(new_pin)
    _record(account, "pin_change", 0, memo="PIN updated")
    db.session.commit()


def deposit(account, amount, memo=None):
    cents = banking.parse_amount(amount)
    account.balance_cents += cents
    tx = _record(account, "deposit", cents, memo=_memo(memo) or "Deposit")
    db.session.commit()
    return tx


def _ensure_funds(account, cents):
    if cents > account.balance_cents:
        raise BankingError(f"Insufficient funds in account {account.number}.", 422)


def withdraw(account, amount, pin, memo=None):
    verify_pin(account, pin)
    cents = banking.parse_amount(amount)
    _ensure_funds(account, cents)
    account.balance_cents -= cents
    tx = _record(account, "withdrawal", -cents, memo=_memo(memo) or "Withdrawal")
    db.session.commit()
    return tx


def atm_withdraw(account, amount, pin):
    verify_pin(account, pin)
    dollars = banking.validate_atm_amount(amount)
    cents = dollars * 100
    _ensure_funds(account, cents)
    bills = banking.atm_bills(dollars)
    account.balance_cents -= cents
    tx = _record(account, "atm", -cents, memo="ATM withdrawal", details={"bills": bills})
    db.session.commit()
    return tx, bills


def deposit_coins(account, coins):
    cents, counts, invalid = banking.parse_change(coins)
    if cents <= 0:
        if invalid:
            raise BankingError(f"Invalid coin character: {', '.join(invalid)}")
        raise BankingError("Enter at least one coin (P, N, D, Q, H, W).")
    account.balance_cents += cents
    tx = _record(
        account, "coins", cents, memo="Coin deposit",
        details={"coins": {k: v for k, v in counts.items() if v}, "invalid": invalid},
    )
    db.session.commit()
    return tx, invalid


def find_open_account(number):
    try:
        number = int(str(number).strip())
    except (TypeError, ValueError):
        raise BankingError("Account numbers are 8 digits.")
    account = db.session.scalar(select(Account).where(Account.number == number))
    if not account or account.status != "open":
        raise BankingError(f"Account not found for account number: {number}", 404)
    return account


def transfer(user, from_number, to_number, amount, pin, memo=None):
    source = get_owned_account(user, from_number)
    target = find_open_account(to_number)
    if target.id == source.id:
        raise BankingError("Choose two different accounts.")
    verify_pin(source, pin)
    cents = banking.parse_amount(amount)
    _ensure_funds(source, cents)

    memo = _memo(memo)
    source.balance_cents -= cents
    target.balance_cents += cents
    out_tx = _record(source, "transfer_out", -cents, counterparty=target.number, memo=memo or "Transfer sent")
    _record(target, "transfer_in", cents, counterparty=source.number, memo=memo or "Transfer received")
    db.session.commit()
    return out_tx, source, target


def close_account(account, pin):
    verify_pin(account, pin)
    if account.balance_cents != 0:
        raise BankingError(
            "Withdraw or transfer the remaining balance before closing this account.", 422
        )
    account.status = "closed"
    account.closed_at = utcnow()
    _record(account, "closed", 0, memo="Account closed")
    db.session.commit()


def apply_monthly_interest(annual_rate):
    """Bank.addMonthlyInterest across every open account."""
    rate = banking.validate_interest_rate(annual_rate)
    accounts = db.session.scalars(
        select(Account).where(Account.status == "open", Account.balance_cents > 0)
    ).all()
    results, total = [], 0
    for account in accounts:
        interest = banking.monthly_interest(account.balance_cents, rate)
        if interest <= 0:
            continue
        account.balance_cents += interest
        _record(account, "interest", interest, memo=f"Monthly interest at {rate}% APR",
                details={"annualRate": str(rate)})
        total += interest
        results.append({"number": account.number, "interestCents": interest,
                        "balanceCents": account.balance_cents})
    db.session.commit()
    return {"rate": str(rate), "accountsCredited": len(results), "totalCents": total, "results": results}


# ---------------------------------------------------------------- reporting

def list_transactions(account_ids, limit=50, offset=0, kind=None):
    if not account_ids:
        return [], 0
    query = select(Transaction).where(Transaction.account_id.in_(account_ids))
    if kind:
        query = query.where(Transaction.kind.in_(kind.split(",")))
    total = db.session.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.session.scalars(
        query.order_by(Transaction.created_at.desc(), Transaction.id.desc()).limit(limit).offset(offset)
    ).all()
    return rows, total


def summary(user, days=30):
    accounts = [a for a in user.accounts if a.status == "open"]
    ids = [a.id for a in user.accounts]
    total = sum(a.balance_cents for a in accounts)
    since = utcnow() - timedelta(days=days)

    txs = db.session.scalars(
        select(Transaction)
        .where(Transaction.account_id.in_(ids), Transaction.created_at >= since)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
    ).all() if ids else []

    money_in = sum(t.amount_cents for t in txs if t.amount_cents > 0)
    money_out = -sum(t.amount_cents for t in txs if t.amount_cents < 0)

    # Walk backwards from today's total to build a daily closing-balance series.
    today = utcnow().date()
    series, running, i = [], total, 0
    for d in range(days):
        day = today - timedelta(days=d)
        series.append({"date": day.isoformat(), "balanceCents": running})
        while i < len(txs) and _date(txs[i].created_at) >= day:
            running -= txs[i].amount_cents
            i += 1
    series.reverse()

    return {
        "totalBalanceCents": total,
        "openAccounts": len(accounts),
        "moneyInCents": money_in,
        "moneyOutCents": money_out,
        "transactionCount": len([t for t in txs if t.amount_cents != 0]),
        "series": series,
    }


def bank_stats():
    open_count = open_account_count()
    return {
        "openAccounts": open_count,
        "capacity": current_app.config["MAX_ACCOUNTS"],
        "customers": db.session.scalar(select(func.count(User.id))),
        "depositsCents": db.session.scalar(
            select(func.coalesce(func.sum(Account.balance_cents), 0)).where(Account.status == "open")
        ),
    }


def _date(dt):
    return dt.date()


def _memo(memo):
    memo = str(memo or "").strip()
    return memo[:140] or None
