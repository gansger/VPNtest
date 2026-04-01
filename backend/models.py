from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    keys = relationship("VPNKey", back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    status = Column(String, default="inactive")  # inactive, active, expired
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    payment_id = Column(String, nullable=True)  # ID платежа Telegram Stars
    
    user = relationship("User", back_populates="subscription")


class VPNKey(Base):
    __tablename__ = "vpn_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    public_key = Column(String, nullable=False)
    encrypted_private_key = Column(Text, nullable=False)  # Зашифрованный приватный ключ
    config_content = Column(Text, nullable=False)  # Полный конфиг для клиента
    ip_address = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="keys")
