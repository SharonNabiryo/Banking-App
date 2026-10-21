from datetime import datetime, timezone

from sqlalchemy import BigInteger, ForeignKey, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from .banking import mask_ssn
from .extensions import db


def utcnow():
    return datetime.now(timezone.utc)


def iso(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:  # SQLite drops tz info; values are always stored as UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    ssn_hash: Mapped[str] = mapped_column(String(64), unique=True)
    ssn_last4: Mapped[str] = mapped_column(String(4))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    accounts: Mapped[list["Account"]] = relationship(back_populates="owner", order_by="Account.id")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "ssn": mask_ssn(self.ssn_last4),
            "isAdmin": self.is_admin,
            "createdAt": iso(self.created_at),
        }


class Account(db.Model):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    nickname: Mapped[str] = mapped_column(String(60))
    kind: Mapped[str] = mapped_column(String(20), default="checking")
    pin_hash: Mapped[str] = mapped_column(String(255))
    balance_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(10), default="open")
    failed_pin_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped[User] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account", order_by="Transaction.id.desc()"
    )

    def set_pin(self, pin):
        self.pin_hash = generate_password_hash(pin)

    def check_pin(self, pin):
        return check_password_hash(self.pin_hash, str(pin))

    def to_dict(self, include_owner=False):
        data = {
            "number": self.number,
            "nickname": self.nickname,
            "kind": self.kind,
            "balanceCents": self.balance_cents,
            "status": self.status,
            "createdAt": iso(self.created_at),
            "closedAt": iso(self.closed_at),
        }
        if include_owner:
            data["owner"] = {
                "firstName": self.owner.first_name,
                "lastName": self.owner.last_name,
                "email": self.owner.email,
                "ssn": mask_ssn(self.owner.ssn_last4),
            }
        return data


class Transaction(db.Model):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    # Signed: positive = money in, negative = money out.
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    balance_after_cents: Mapped[int] = mapped_column(BigInteger)
    counterparty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    memo: Mapped[str | None] = mapped_column(String(140), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    account: Mapped[Account] = relationship(back_populates="transactions")

    def to_dict(self):
        return {
            "id": self.id,
            "account": self.account.number,
            "kind": self.kind,
            "amountCents": self.amount_cents,
            "balanceAfterCents": self.balance_after_cents,
            "counterparty": self.counterparty,
            "memo": self.memo,
            "details": self.details,
            "createdAt": iso(self.created_at),
        }
