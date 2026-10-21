from conftest import open_account, register


def test_register_login_and_me(client, user):
    res = client.get("/api/auth/me", headers=user)
    assert res.json["user"]["firstName"] == "Jane"
    assert res.json["user"]["ssn"] == "XXX-XX-3456"
    login = client.post("/api/auth/login", json={"email": "JANE@test.dev", "password": "password123"})
    assert login.status_code == 200
    bad = client.post("/api/auth/login", json={"email": "jane@test.dev", "password": "nope"})
    assert bad.status_code == 401


def test_duplicate_ssn_rejected(client, user):
    res = client.post("/api/auth/register", json={
        "email": "other@test.dev", "password": "password123", "firstName": "A", "lastName": "B",
        "ssn": "999123456"})
    assert res.status_code == 409


def test_requires_auth(client):
    assert client.get("/api/accounts").status_code == 401


def test_open_deposit_withdraw(client, user):
    number, pin = open_account(client, user, "100.00")
    assert len(str(number)) == 8
    res = client.post(f"/api/accounts/{number}/deposit", json={"amount": "2.57"}, headers=user)
    assert res.json["account"]["balanceCents"] == 10257
    res = client.post(f"/api/accounts/{number}/withdraw", json={"amount": "500", "pin": pin}, headers=user)
    assert res.status_code == 422
    res = client.post(f"/api/accounts/{number}/withdraw", json={"amount": "0.57", "pin": pin}, headers=user)
    assert res.json["account"]["balanceCents"] == 10200


def test_wrong_pin_locks_account(client, user):
    number, pin = open_account(client, user, "10")
    wrong = "0000" if pin != "0000" else "1111"
    for _ in range(4):
        res = client.post(f"/api/accounts/{number}/withdraw", json={"amount": "1", "pin": wrong}, headers=user)
        assert res.status_code == 403
    res = client.post(f"/api/accounts/{number}/withdraw", json={"amount": "1", "pin": wrong}, headers=user)
    assert res.status_code == 423
    res = client.post(f"/api/accounts/{number}/withdraw", json={"amount": "1", "pin": pin}, headers=user)
    assert res.status_code == 423


def test_atm_and_coins(client, user):
    number, pin = open_account(client, user, "200")
    res = client.post(f"/api/accounts/{number}/atm", json={"amount": 85, "pin": pin}, headers=user)
    assert res.json["bills"] == {"20": 4, "10": 0, "5": 1}
    assert res.json["account"]["balanceCents"] == 11500
    res = client.post(f"/api/accounts/{number}/coins", json={"coins": "QQQQZ"}, headers=user)
    assert res.json["invalid"] == ["Z"]
    assert res.json["account"]["balanceCents"] == 11600


def test_transfer_between_customers(client, user):
    src, pin = open_account(client, user, "50")
    other = register(client, email="bob@test.dev", ssn="999222333", first="bob", last="smith")
    dst, _ = open_account(client, other)
    lookup = client.get(f"/api/recipients/{dst}", headers=user)
    assert lookup.json["name"] == "Bob S."
    res = client.post("/api/transfers", json={"from": src, "to": dst, "amount": "20", "pin": pin}, headers=user)
    assert res.status_code == 200, res.json
    assert res.json["from"]["balanceCents"] == 3000
    assert "balanceCents" not in res.json["to"]
    theirs = client.get("/api/accounts", headers=other).json["accounts"][0]
    assert theirs["balanceCents"] == 2000
    # Can't move money out of someone else's account.
    res = client.post("/api/transfers", json={"from": dst, "to": src, "amount": "1", "pin": pin}, headers=user)
    assert res.status_code == 404


def test_change_pin_and_close(client, user):
    number, pin = open_account(client, user, "5")
    res = client.put(f"/api/accounts/{number}/pin",
                     json={"currentPin": pin, "newPin": "4321", "confirmPin": "4320"}, headers=user)
    assert res.status_code == 400
    res = client.put(f"/api/accounts/{number}/pin",
                     json={"currentPin": pin, "newPin": "4321", "confirmPin": "4321"}, headers=user)
    assert res.status_code == 200
    assert client.post(f"/api/accounts/{number}/close", json={"pin": "4321"}, headers=user).status_code == 422
    client.post(f"/api/accounts/{number}/withdraw", json={"amount": "5", "pin": "4321"}, headers=user)
    assert client.post(f"/api/accounts/{number}/close", json={"pin": "4321"}, headers=user).status_code == 200
    assert client.get("/api/accounts", headers=user).json["accounts"] == []


def test_transactions_and_summary(client, user):
    number, _ = open_account(client, user, "100")
    client.post(f"/api/accounts/{number}/deposit", json={"amount": "25"}, headers=user)
    res = client.get(f"/api/accounts/{number}/transactions", headers=user)
    kinds = [t["kind"] for t in res.json["transactions"]]
    assert kinds == ["deposit", "deposit", "opened"]
    summary = client.get("/api/summary", headers=user).json
    assert summary["totalBalanceCents"] == 12500
    assert summary["moneyInCents"] == 12500
    assert summary["series"][-1]["balanceCents"] == 12500
    assert summary["series"][0]["balanceCents"] == 0


def test_admin_interest(app, client, user):
    number, _ = open_account(client, user, "1000")
    assert client.post("/api/admin/interest", json={"annualRate": "2.75"}, headers=user).status_code == 403
    from app.extensions import db
    from app.models import User
    with app.app_context():
        db.session.query(User).update({"is_admin": True})
        db.session.commit()
    res = client.post("/api/admin/interest", json={"annualRate": "2.75"}, headers=user)
    assert res.json["totalCents"] == 229
    accounts = client.get("/api/admin/accounts", headers=user).json["accounts"]
    assert accounts[0]["balanceCents"] == 100229


def test_bank_capacity(app, client, user):
    app.config["MAX_ACCOUNTS"] = 1
    open_account(client, user)
    res = client.post("/api/accounts", json={}, headers=user)
    assert res.status_code == 409
