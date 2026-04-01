import subprocess
import uuid
import os
from typing import Optional, Tuple
from cryptography.fernet import Fernet

# Настройка шифрования
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "32_byte_encryption_key_here!!")
# Убедитесь, что ключ имеет правильную длину (32 байта для Fernet это base64 encoded 32 bytes)
# Для простоты используем базовый пример, в продакшене генерируйте через Fernet.generate_key()
try:
    fernet = Fernet(ENCRYPTION_KEY.encode() if len(ENCRYPTION_KEY.encode()) == 44 else Fernet.generate_key())
except Exception:
    # Если ключ невалиден, генерируем новый (в продакшене так делать нельзя, нужно хранить в env)
    fernet = Fernet(Fernet.generate_key())


def encrypt_data(data: str) -> str:
    """Шифрует строку."""
    return fernet.encrypt(data.encode()).decode()


def decrypt_data(token: str) -> str:
    """Расшифровывает строку."""
    return fernet.decrypt(token.encode()).decode()


class WireGuardManager:
    """
    Менеджер для управления интерфейсом WireGuard.
    Требует прав root или настройки sudo для wg-quick и ip.
    
    Важно: Этот скрипт предполагает, что на сервере установлен wireguard-tools
    и настроен интерфейс wg0 (или другой).
    
    Для AmneziaVPN логика может отличаться, если используется модифицированный протокол.
    В таком случае потребуется использование API Amnezia или прямое редактирование конфигов.
    """

    def __init__(self, interface: str = "wg0", config_dir: str = "/etc/wireguard"):
        self.interface = interface
        self.config_dir = config_dir

    def generate_keys(self) -> Tuple[str, str]:
        """Генерирует приватный и публичный ключи."""
        try:
            private_key = subprocess.check_output(["wg", "genkey"]).decode().strip()
            public_key = subprocess.check_output(["wg", "pubkey"], input=private_key.encode()).decode().strip()
            return private_key, public_key
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Ошибка генерации ключей WireGuard: {e}")

    def add_peer(self, public_key: str, allowed_ips: str) -> bool:
        """
        Добавляет пира в интерфейс WireGuard.
        Требуется запуск от root.
        """
        try:
            cmd = f"wg set {self.interface} peer {public_key} allowed-ips {allowed_ips}"
            subprocess.run(cmd, shell=True, check=True)
            
            # Сохраняем конфигурацию (для некоторых систем требуется вручную)
            # wg-quick save <interface> работает не везде, лучше перезагрузить конфиг
            self._save_config()
            return True
        except subprocess.CalledProcessError as e:
            print(f"Ошибка добавления пира: {e}")
            return False

    def _save_config(self):
        """
        Перезагружает конфиг интерфейса.
        В продакшене лучше использовать wg-quick save или управлять конфигами вручную.
        """
        try:
            # Попытка сохранить конфиг (работает на Debian/Ubuntu с wg-quick)
            subprocess.run(f"wg-quick save {self.interface}", shell=True)
        except Exception:
            # Если не удалось, просто перезагружаем интерфейс (может разорвать соединения)
            # В продакшене реализуйте правильное управление конфигами
            pass

    def generate_client_config(
        self, 
        private_key: str, 
        server_public_key: str, 
        server_endpoint: str, 
        client_ip: str,
        dns: str = "1.1.1.1"
    ) -> str:
        """Генерирует строку конфига для клиента."""
        config = f"""[Interface]
PrivateKey = {private_key}
Address = {client_ip}/32
DNS = {dns}

[Peer]
PublicKey = {server_public_key}
Endpoint = {server_endpoint}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
"""
        return config

    def get_server_public_key(self) -> str:
        """Получает публичный ключ сервера."""
        try:
            # Читаем приватный ключ из конфига сервера
            config_path = os.path.join(self.config_dir, f"{self.interface}.conf")
            with open(config_path, "r") as f:
                content = f.read()
            
            # Ищем PrivateKey
            for line in content.split("\n"):
                if line.startswith("PrivateKey"):
                    server_private = line.split("=")[1].strip()
                    # Получаем публичный из приватного
                    public_key = subprocess.check_output(["wg", "pubkey"], input=server_private.encode()).decode().strip()
                    return public_key
            
            raise RuntimeError("Не найден PrivateKey в конфиге сервера")
        except Exception as e:
            raise RuntimeError(f"Ошибка получения публичного ключа сервера: {e}")


def create_vpn_config_for_user(user_id: int, user_ip: str, server_endpoint: str) -> dict:
    """
    Создает полную конфигурацию VPN для пользователя.
    Возвращает словарь с зашифрованным приватным ключом и конфигом.
    """
    manager = WireGuardManager()
    
    # Генерируем ключи
    client_private, client_public = manager.generate_keys()
    
    # Получаем публичный ключ сервера
    server_public = manager.get_server_public_key()
    
    # Добавляем пира на сервер (требует root!)
    # В реальном приложении это должно выполняться через celery task или с sudo
    # manager.add_peer(client_public, f"{user_ip}/32")
    
    # Генерируем конфиг для клиента
    config_content = manager.generate_client_config(
        private_key=client_private,
        server_public_key=server_public,
        server_endpoint=server_endpoint,
        client_ip=user_ip
    )
    
    # Шифруем приватный ключ перед сохранением в БД
    encrypted_private_key = encrypt_data(client_private)
    
    return {
        "public_key": client_public,
        "encrypted_private_key": encrypted_private_key,
        "config_content": config_content,
        "ip_address": user_ip
    }


if __name__ == "__main__":
    # Тестовый запуск
    print("Тест генерации ключей...")
    try:
        result = create_vpn_config_for_user(
            user_id=123,
            user_ip="10.0.0.5",
            server_endpoint="vpn.example.com:51820"
        )
        print("Конфигурация создана успешно!")
        print(result["config_content"])
    except Exception as e:
        print(f"Ошибка: {e}")
        print("Убедитесь, что WireGuard установлен и запущен, а скрипт запускается от root.")
