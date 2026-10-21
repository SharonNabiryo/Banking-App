from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from .banking import BankingError
from .config import Config
from .extensions import db, jwt
from .models import User


def create_app(config_class=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    if app.config["CORS_ORIGINS"]:
        CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    from .routes import accounts, admin, auth
    app.register_blueprint(auth.bp)
    app.register_blueprint(accounts.bp)
    app.register_blueprint(admin.bp)

    _register_jwt_handlers()
    _register_error_handlers(app)
    _register_frontend(app)

    from .cli import register_cli
    register_cli(app)

    with app.app_context():
        db.create_all()
        if app.config["SEED_DEMO"]:
            from .cli import seed_demo
            seed_demo()
        # Drop connections opened during startup so forked gunicorn workers
        # (--preload) each open their own instead of sharing one socket.
        # (Skipped for SQLite, where an in-memory database would be lost.)
        if db.engine.url.get_backend_name() != "sqlite":
            db.engine.dispose()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


def _register_jwt_handlers():
    @jwt.user_lookup_loader
    def load_user(_header, payload):
        return db.session.get(User, int(payload["sub"]))

    @jwt.user_lookup_error_loader
    def missing_user(_header, _payload):
        return jsonify(error="Your session is no longer valid. Please sign in again."), 401

    @jwt.expired_token_loader
    def expired(_header, _payload):
        return jsonify(error="Your session has expired. Please sign in again."), 401

    @jwt.unauthorized_loader
    @jwt.invalid_token_loader
    def unauthorized(reason):
        return jsonify(error="Please sign in to continue."), 401


def _register_error_handlers(app):
    @app.errorhandler(BankingError)
    def banking_error(err):
        db.session.rollback()
        return jsonify(error=err.message), err.status

    @app.errorhandler(HTTPException)
    def http_error(err):
        return jsonify(error=err.description), err.code

    @app.errorhandler(Exception)
    def unexpected(err):
        db.session.rollback()
        app.logger.exception(err)
        return jsonify(error="Something went wrong on our side."), 500


def _register_frontend(app):
    """Serve the built React app (frontend/dist) so one process can host everything."""
    dist = app.config["FRONTEND_DIST"]

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def frontend(path):
        if path.startswith("api/"):
            return jsonify(error="Not found"), 404
        if not (dist / "index.html").exists():
            return jsonify(message="API is running. Start the React dev server in /frontend."), 200
        if path and (dist / path).is_file():
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")
