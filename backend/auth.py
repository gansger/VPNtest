import os
import hmac
import hashlib
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "your_secret_key"
    telegram_bot_token: str = ""
    database_url: str = "sqlite+aiosqlite:///./vpn.db"
    encryption_key: str = "32_byte_encryption_key_here!!"

    class Config:
        env_file = ".env"


settings = Settings()


def validate_telegram_init_data(init_data: str, bot_token: str) -> bool:
    """
    Валидация initData от Telegram WebApp.
    Возвращает True, если данные валидны и не просрочены.
    """
    try:
        data = {}
        for pair in init_data.split("&"):
            key, value = pair.split("=", 1)
            data[key] = value

        if "hash" not in data:
            return False

        received_hash = data.pop("hash")
        
        # Сортируем ключи и формируем строку для проверки
        data_check_string = "\n".join(
            f"{key}={value}" for key, value in sorted(data.items())
        )

        # Формируем секретный ключ
        secret_key = hmac.new(
            b"WebAppData",
            bot_token.encode(),
            hashlib.sha256
        ).digest()

        # Вычисляем хеш
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        if calculated_hash != received_hash:
            return False

        # Проверка времени (опционально, если есть auth_date)
        if "auth_date" in data:
            auth_time = int(data["auth_date"])
            import time
            if time.time() - auth_time > 86400:  # 24 часа
                return False

        return True
    except Exception:
        return False


def get_user_from_init_data(init_data: str) -> Optional[dict]:
    """
    Извлекает данные пользователя из initData.
    """
    try:
        data = {}
        for pair in init_data.split("&"):
            key, value = pair.split("=", 1)
            data[key] = value

        if "user" not in data:
            return None

        import json
        import urllib.parse
        user_json = urllib.parse.unquote(data["user"])
        return json.loads(user_json)
    except Exception:
        return None
