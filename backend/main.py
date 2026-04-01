from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from typing import Optional
import json

from models import Base, User, Subscription, VPNKey
from auth import settings, validate_telegram_init_data, get_user_from_init_data
from vpn_manager import create_vpn_config_for_user, encrypt_data, decrypt_data

# Настройка базы данных
engine = create_async_engine(settings.database_url, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

app = FastAPI(title="VPN TMA Backend")

# CORS для Telegram WebApp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене укажите конкретный домен
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def get_current_user(
    init_data: str,
    db: AsyncSession = Depends(get_db)
) -> User:
    """Зависимость для получения текущего пользователя."""
    if not validate_telegram_init_data(init_data, settings.telegram_bot_token):
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")
    
    user_data = get_user_from_init_data(init_data)
    if not user_data:
        raise HTTPException(status_code=400, detail="User data not found")
    
    telegram_id = user_data.get("id")
    
    # Проверяем, есть ли пользователь в БД
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    
    if not user:
        # Создаем нового пользователя
        user = User(
            telegram_id=telegram_id,
            username=user_data.get("username"),
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name")
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return user


@app.on_event("startup")
async def on_startup():
    """Создание таблиц БД при запуске."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/api/me")
async def get_me(user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе."""
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "has_subscription": user.subscription is not None and user.subscription.status == "active"
    }


@app.post("/api/create-invoice")
async def create_invoice(
    init_data: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Создание счета на оплату подписки через Telegram Stars.
    В реальном приложении здесь формируется invoice для Telegram Bot API.
    """
    # Здесь должна быть логика создания инвойса через Bot API
    # Для примера возвращаем mock-данные
    return {
        "invoice_id": "invoice_123",
        "amount_stars": 100,
        "description": "VPN Subscription - 1 month",
        "payload": f"user_{user.id}"
    }


@app.post("/api/webhook/payment")
async def payment_webhook(
    request_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Вебхук для обработки успешной оплаты.
    Вызывается Telegram после успешной оплаты Stars.
    """
    # Валидация запроса от Telegram (проверка подписи)
    # ...
    
    payment_id = request_data.get("telegram_payment_charge_id")
    user_id = request_data.get("payload")  # payload, который мы передали
    
    if not user_id or not user_id.startswith("user_"):
        raise HTTPException(status_code=400, detail="Invalid payload")
    
    user_id = int(user_id.split("_")[1])
    
    # Находим пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Активируем подписку
    if not user.subscription:
        subscription = Subscription(
            user_id=user.id,
            status="active",
            payment_id=payment_id
        )
        db.add(subscription)
    else:
        user.subscription.status = "active"
        user.subscription.payment_id = payment_id
    
    from datetime import datetime, timedelta
    if not user.subscription.start_date:
        user.subscription.start_date = datetime.utcnow()
    user.subscription.end_date = datetime.utcnow() + timedelta(days=30)
    
    await db.commit()
    
    return {"status": "success", "message": "Subscription activated"}


@app.get("/api/subscription")
async def get_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статуса подписки."""
    if not user.subscription:
        return {"status": "inactive"}
    
    return {
        "status": user.subscription.status,
        "start_date": user.subscription.start_date.isoformat() if user.subscription.start_date else None,
        "end_date": user.subscription.end_date.isoformat() if user.subscription.end_date else None
    }


@app.get("/api/key")
async def get_vpn_key(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Получение конфигурации VPN.
    Доступно только пользователям с активной подпиской.
    """
    if not user.subscription or user.subscription.status != "active":
        raise HTTPException(status_code=403, detail="No active subscription")
    
    # Проверяем, есть ли уже ключ
    result = await db.execute(select(VPNKey).where(VPNKey.user_id == user.id))
    key = result.scalar_one_or_none()
    
    if key:
        # Возвращаем существующий ключ
        # Приватный ключ расшифровываем только если нужно (лучше отдавать сразу конфиг)
        return {
            "config": key.config_content,
            "created_at": key.created_at.isoformat()
        }
    
    # Генерируем новый ключ
    # Определяем следующий доступный IP (упрощенно)
    next_ip = "10.0.0.10"  # В реальности нужно проверять занятые IP
    
    try:
        vpn_data = create_vpn_config_for_user(
            user_id=user.id,
            user_ip=next_ip,
            server_endpoint="vpn.yourdomain.com:51820"  # Заменить на ваш сервер
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate key: {str(e)}")
    
    # Сохраняем в БД
    new_key = VPNKey(
        user_id=user.id,
        public_key=vpn_data["public_key"],
        encrypted_private_key=vpn_data["encrypted_private_key"],
        config_content=vpn_data["config_content"],
        ip_address=vpn_data["ip_address"]
    )
    db.add(new_key)
    
    # Добавляем пира на сервер (требует прав root!)
    # В продакшене это должно быть через очередь задач или sudo
    # from vpn_manager import WireGuardManager
    # manager = WireGuardManager()
    # manager.add_peer(vpn_data["public_key"], f"{next_ip}/32")
    
    await db.commit()
    await db.refresh(new_key)
    
    return {
        "config": new_key.config_content,
        "created_at": new_key.created_at.isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
