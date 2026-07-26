import os
from pydantic import EmailStr
from fastapi_mail import ConnectionConfig

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "admin@enterpriseauditor.ai")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "mock_password")
MAIL_FROM = os.getenv("MAIL_FROM", "admin@enterpriseauditor.ai")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_TLS = os.getenv("MAIL_TLS", "True").lower() == "true"
MAIL_SSL = os.getenv("MAIL_SSL", "False").lower() == "true"

templates_dir = os.path.join(os.path.dirname(__file__), "templates")

mail_config = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=MAIL_PORT,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_STARTTLS=MAIL_TLS,
    MAIL_SSL_TLS=MAIL_SSL,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
    TEMPLATE_FOLDER=templates_dir
)
