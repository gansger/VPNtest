#!/bin/bash

# Скрипт для публикации кода на GitHub
# Использование: ./push_to_github.sh <URL_РЕПОЗИТОРИЯ> [ИМЯ_ВЕТКИ]

if [ -z "$1" ]; then
    echo "Ошибка: Не указан URL репозитория."
    echo "Пример использования: ./push_to_github.sh https://github.com/user/repo.git [main]"
    exit 1
fi

REPO_URL=$1
BRANCH_NAME=${2:-main} # По умолчанию используем ветку 'main', если не указана другая

echo "🚀 Начало публикации на GitHub..."

# Проверка наличия файлов для коммита
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️ Нет изменений для коммита. Рабочая директория чиста."
else
    echo "➕ Добавление всех файлов..."
    git add .
    
    echo "💾 Создание коммита..."
    git commit -m "Initial commit: project structure and README"
fi

# Настройка удалённого репозитория
echo "🔗 Настройка удалённого репозитория (origin)..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Отправка кода
echo "📤 Отправка кода в ветку $BRANCH_NAME..."
git push -u origin "$BRANCH_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Успешно! Код опубликован на $REPO_URL"
else
    echo "❌ Ошибка при пуше. Проверьте доступы и название ветки."
    echo "Возможно, вам нужно создать ветку $BRANCH_NAME на GitHub или использовать 'master' вместо 'main'."
fi
