# Telegram Mini App для продажи VPN подписок

## Описание проекта

Это полнофункциональное приложение для продажи подписок на VPN через Telegram Mini App (TMA). Пользователи могут:
- Войти через Telegram
- Выбрать и оплатить тариф через Telegram Stars
- Получить конфигурационный файл WireGuard для подключения

## Структура проекта

```
├── backend/                 # Серверная часть на FastAPI
│   ├── main.py             # Основной файл приложения
│   ├── models.py           # Модели базы данных
│   ├── auth.py             # Аутентификация через Telegram
│   ├── vpn_manager.py      # Генерация WireGuard конфигов
│   ├── requirements.txt    # Зависимости Python
│   └── .env.example        # Пример переменных окружения
├── frontend/               # Клиентская часть на React
│   ├── src/
│   │   ├── App.tsx        # Основное приложение
│   │   ├── main.tsx       # Точка входа
│   │   └── index.css      # Стили Tailwind
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── scripts/               # Скрипты развертывания
```

## Требования

### Бэкенд
- Python 3.9+
- PostgreSQL или SQLite
- WireGuard tools (`wg`, `wg-quick`)
- Права root для управления WireGuard

### Фронтенд
- Node.js 18+
- npm или yarn

### Telegram
- Bot Token от [@BotFather](https://t.me/BotFather)
- Настроенный Web App в настройках бота

## Установка

### 1. Бэкенд

```bash
cd backend

# Создаем виртуальное окружение
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Копируем .env.example в .env и заполняем
cp .env.example .env
# Отредактируйте .env, указав ваш BOT_TOKEN и другие параметры

# Запускаем сервер
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Фронтенд

```bash
cd frontend

# Устанавливаем зависимости
npm install

# Создаем .env.local с URL бэкенда
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Запускаем dev-сервер
npm run dev
```

### 3. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. В настройках бота укажите:
   - **Menu Button** → Configure Menu Button → URL вашего фронтенда
   - Или создайте команду `/vpn` с ссылкой на Web App

### 4. Настройка WireGuard на сервере

```bash
# Установка WireGuard (Ubuntu/Debian)
sudo apt update
sudo apt install wireguard wireguard-tools

# Генерация ключей сервера
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key

# Создание конфига сервера /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <ваш_приватный_ключ>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Запуск WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

## Интеграция с Amnezia VPN

Если вы используете Amnezia VPN (с модифицированным протоколом):

1. **Вариант A**: Использовать стандартный WireGuard интерфейс (если Amnezia настроена в совместимом режиме)
2. **Вариант B**: Прямое редактирование конфигов Amnezia через API
3. **Вариант C**: Docker API для управления контейнером Amnezia

⚠️ **Важно**: Для генерации конфигов в `vpn_manager.py` требуется:
- Запуск процесса от имени root
- Наличие установленного `wireguard-tools`
- Доступ к файлам конфигурации в `/etc/wireguard/`

## Переменные окружения

### Backend (.env)
```
SECRET_KEY=your_secret_key_for_encryption
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
DATABASE_URL=sqlite+aiosqlite:///./vpn.db
ENCRYPTION_KEY=your_32_byte_encryption_key_here
```

### Frontend (.env.local)
```
VITE_API_URL=https://your-api-domain.com
```

## Безопасность

1. **Валидация initData**: Все запросы проверяются через HMAC-подпись Telegram
2. **Шифрование ключей**: Приватные ключи WireGuard шифруются в БД через Fernet
3. **CORS**: Ограничьте домены в production
4. **HTTPS**: Обязательно используйте HTTPS в production

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/me` | Информация о пользователе |
| POST | `/api/create-invoice` | Создание счета на оплату |
| POST | `/api/webhook/payment` | Вебхук оплаты (от Telegram) |
| GET | `/api/subscription` | Статус подписки |
| GET | `/api/key` | Получение VPN конфига |

## Развертывание в Production

1. **Бэкенд**:
   - Разместите на VPS с публичным IP
   - Используйте nginx как reverse proxy
   - Настройте SSL через Let's Encrypt
   - Запустите через systemd или Docker

2. **Фронтенд**:
   - Соберите билд: `npm run build`
   - Разместите на статическом хостинге (Vercel, Netlify, или свой сервер)

3. **WireGuard**:
   - Откройте порт 51820/UDP на фаерволе
   - Настройте IP forwarding в системе

## Лицензия

MIT