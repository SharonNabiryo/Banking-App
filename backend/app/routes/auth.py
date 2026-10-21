from flask import Blueprint
from flask_jwt_extended import create_access_token, current_user, jwt_required

from .. import services
from .helpers import body

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _session(user):
    return {"token": create_access_token(identity=str(user.id)), "user": user.to_dict()}


@bp.post("/register")
def register():
    data = body()
    user = services.register_user(
        data.get("email"), data.get("password"),
        data.get("firstName"), data.get("lastName"), data.get("ssn"),
    )
    return _session(user), 201


@bp.post("/login")
def login():
    data = body()
    return _session(services.authenticate(data.get("email"), data.get("password")))


@bp.get("/me")
@jwt_required()
def me():
    return {"user": current_user.to_dict()}
