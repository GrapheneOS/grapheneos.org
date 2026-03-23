# AGENTS.md - Инструкции для AI Assistant

## Запуск проекта на Windows

Проект использует bash-скрипты и GNU-утилиты. Для Windows используйте **Docker**:

### Docker (рекомендуется)

1. Убедитесь, что Docker Desktop запущен

2. Соберите и запустите:
```powershell
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

Сайт будет доступен на http://localhost

### Добавление в hosts (для тестирования)

Добавьте в `C:\Windows\System32\drivers\etc\hosts`:
```
127.0.0.1 grapheneostest.org
```

### WSL2 (альтернатива)

```bash
wsl --install
# В WSL Ubuntu:
sudo apt update && sudo apt install -y python3-venv python3-pip nodejs npm openjdk-17-jre parallel moreutils rsync brotli zopfli libxml2-utils gixy
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
npm ci
./process-static
```

## Структура проекта

```
grapheneos.org/
├── .github/workflows/     # GitHub Actions CI
│   └── ci.yml            # CI пайплайн (pytest + Playwright + lint)
├── openspec/             # OpenSpec планирование
│   ├── changes/         # Изменения
│   └── specs/           # Спецификации
├── templates/            # Jinja2 шаблоны
│   ├── header.html      # Хедер с языковым переключателем
│   └── head-seo.html   # SEO теги (canonical, hreflang)
├── static/              # Исходные статические файлы
├── i18n/                # Переводы
│   ├── en/messages.json
│   ├── de/messages.json
│   ├── fr/messages.json
│   ├── es/messages.json
│   └── ru/messages.json
├── tests/               # Тесты
│   ├── functional.spec.cjs    # Playwright функциональные тесты
│   ├── test_i18n.py           # pytest тесты I18n
│   ├── test_date_formatting.py
│   ├── test_number_currency.py
│   └── test_jinja2_integration.py
├── jinja2i18n.py        # Модуль интернационализации
├── process-templates    # Обработка Jinja2 шаблонов
├── process-static       # Полный пайплайн сборки
├── generate-sitemap     # Генерация многоязычного sitemap.xml
├── generate-feed        # Генерация Atom feed
├── nginx/               # Конфигурация nginx
│   └── nginx-dev.conf  # Конфиг для локальной разработки
└── static-tmp/          # Собранные файлы (создаётся автоматически)
```

## i18n (Интернационализация)

### Поддерживаемые языки

- English (en) - по умолчанию
- Deutsch (de)
- Français (fr)
- Español (es)
- Русский (ru)

### Функции jinja2i18n.py

- `_()` - перевод строк
- `datenl()` - форматирование даты
- `numberl()` - форматирование чисел
- `currencyl()` - форматирование валюты
- `get_lang()` - получить текущий язык
- `get_languages()` - список поддерживаемых языков
- `generate_seo_tags()` - генерация canonical + hreflang тегов

### Nginx языковая маршрутизация

- Проверяет cookie `lang` (приоритет)
- Проверяет заголовок `Accept-Language`
- Перенаправляет на `/de/`, `/fr/`, `/es/`, `/ru/` при необходимости
- Устанавливает cookie для запоминания выбора

## GitHub Actions CI

`.github/workflows/ci.yml` включает:

```yaml
jobs:
  test:      # Python pytest (60 тестов)
  lint:      # ESLint + Stylelint  
  playwright: # Playwright функциональные тесты (18 тестов)
  build:     # Сборка проекта
```

Запускается автоматически при пуше в main/master или pull request.

## Сборка (в Docker/WSL)

```bash
# Полная сборка со всеми проверками
./process-static

# Отдельные шаги:
python process-templates static        # Только шаблоны
./generate-sitemap                    # Sitemap
./generate-feed                       # Feed
```

## Проверка качества

Скрипт `process-static` автоматически запускает:
- `eslint` для JavaScript
- `stylelint` для CSS
- `vnu-jar` для валидации HTML/XML/SVG (отключено)
- `html-minifier-terser` для minification
- `gixy` для проверки nginx конфига

## Тестирование

### Python тесты (pytest)

```powershell
pip install pytest cssselect
python -m pytest tests/ -v
```

Результат: 60 passed

### Функциональные тесты (Playwright)

```powershell
# 1. Установить Playwright (один раз)
npm install -D @playwright/test
npx playwright install chromium

# 2. Запустить сайт
docker build -t grapheneos-website .
docker rm -f grapheneos
docker run -d -p 80:80 --name grapheneos grapheneos-website

# 3. Запустить тесты
npx playwright test tests/functional.spec.cjs --reporter=list
```

Результат: 18 passed (1 skipped)

### Все тесты вместе

```powershell
# pytest
python -m pytest tests/ -v

# Playwright
npx playwright test tests/functional.spec.cjs --reporter=list
```

## Локальный веб-сервер

### Docker

```powershell
# Собрать и запустить на порту 80
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

После изменений — пересобрать:
```powershell
docker build -t grapheneos-website . && docker rm -f grapheneos && docker run -d -p 80:80 --name grapheneos grapheneos-website
```

Откройте http://localhost

### Проброс порта 80 на Windows

Если порт 80 занят:
```powershell
docker run -d -p 8080:80 --name grapheneos grapheneos-website
```

## Развёртывание

```bash
./deploy-static  # Требует доступ к серверам GrapheneOS
```

## Текущий статус

- ✅ Docker сборка
- ✅ Nginx с языковой маршрутизацией
- ✅ Language switcher (кастомный dropdown)
- ✅ SEO теги (canonical + hreflang)
- ✅ Многоязычный sitemap.xml
- ✅ Многоязычный Atom feed
- ✅ GitHub Actions CI
- ✅ pytest тесты (60)
- ✅ Playwright тесты (18)
- 🔄 Language preservation в URL (в разработке)

## Известные проблемы и решения

### 1. Пустые страницы build.html и donate.html в Docker

**Проблема**: После сборки Docker образа файлы `build.html` и `donate.html` имели размер 0 байт.

**Причина**: Использование устаревшего образа Docker. Первый билд создал образ с неполными данными.

**Решение**:
```powershell
# Удалить старый контейнер и образ
docker stop grapheneos
docker rm grapheneos
docker rmi grapheneos-website

# Пересобрать
docker build -t grapheneos-website .
docker run -d -p 80:80 --name grapheneos grapheneos-website
```

### 2. Page Not Found для /features, /build, /usage и других страниц

**Проблема**: Страницы без расширения `.html` возвращали 404.

**Причина**: nginx `try_files` не проверял вариант `$uri.html`.

**Решение**: Изменён `nginx/nginx-dev.conf`:
```nginx
location / {
    try_files $uri $uri.html $uri/ $uri/index.html =404;
}
```

**Важно**: После изменения конфига необходимо пересобрать Docker образ.

### 3. Команды Docker в Windows Git Bash

**Проблема**: Пути Windows (C:/Program Files/Git/...) в выводах ошибок.

**Решение**: Использовать `sh -c` для команд внутри контейнера:
```bash
docker exec grapheneos sh -c "ls -la /usr/share/nginx/html/"
```

### 4. Проверка файлов в контейнере

**Команды для диагностики**:
```bash
# Размеры файлов
docker exec grapheneos sh -c "ls -la /usr/share/nginx/html/*.html"

# Проверка nginx конфига
docker exec grapheneos sh -c "cat /etc/nginx/conf.d/default.conf"

# Тестирование HTTP
curl -s -o /dev/null -w "%{http_code}" http://localhost/features
```

## Примечания

- Все bash-скрипты используют `#!/bin/bash` (требуется bash, не sh)
- Для Windows без WSL/Docker требуется портировать скрипты на Python
- Проект использует GNU parallel, sponge (moreutils), brotli, zopfli
- Валидация vnu-jar отключена из-за предсуществующих проблем с контентом

## Перевод контента страниц (i18n)

### Структура JSON-файлов

Для каждой страницы создаётся JSON-файл с переводами:
```
i18n/
├── en/
│   ├── messages.json     (общие переводы: nav, footer, common)
│   └── index.json         (переводы страницы index)
├── de/
│   ├── messages.json
│   └── index.json
├── fr/
│   ├── messages.json
│   └── index.json
├── es/
│   ├── messages.json
│   └── index.json
└── ru/
    ├── messages.json
    └── index.json
```

### Формат JSON для страниц

```json
{
  "page": "index",
  "title": "GrapheneOS: the private and secure mobile OS",
  "meta_description": "GrapheneOS is a security and privacy focused mobile OS...",
  "hero": {
    "title": "Home",
    "description": "The private and secure mobile operating system...",
    "button": "Install GrapheneOS"
  },
  "about": {
    "title": "About",
    "content": "GrapheneOS is a privacy and security focused mobile OS..."
  }
}
```

### Как добавить переводы для новой страницы

1. **Создать JSON-файл** для каждого языка:
   - `i18n/en/{page}.json`
   - `i18n/de/{page}.json`
   - `i18n/fr/{page}.json`
   - `i18n/es/{page}.json`
   - `i18n/ru/{page}.json`

2. **Запустить сборку**:
   ```bash
   docker build -t grapheneos-website .
   ```

### Текущий статус переводов

| Страница | en | de | fr | es | ru |
|----------|----|----|----|----|----|
| index | ✅ | ✅ | ✅ | ✅ | ✅ |
| features | ❌ | ❌ | ❌ | ❌ | ❌ |
| build | ❌ | ❌ | ❌ | ❌ | ❌ |
| usage | ❌ | ❌ | ❌ | ❌ | ❌ |
| faq | ❌ | ❌ | ❌ | ❌ | ❌ |
| releases | ❌ | ❌ | ❌ | ❌ | ❌ |
| source | ❌ | ❌ | ❌ | ❌ | ❌ |
| donate | ❌ | ❌ | ❌ | ❌ | ❌ |
| contact | ❌ | ❌ | ❌ | ❌ | ❌ |

### Что переводится

- ✅ Заголовки страниц (title)
- ✅ Meta description
- ✅ Навигация (через messages.json)
- ✅ Footer (через messages.json)

### Что НЕ переводится (пока)

- ❌ Основной контент страниц (параграфы, заголовки секций)
- ❌ Кнопки внутри контента
- ❌ Тексты ссылок
- ❌ FAQ вопросы и ответы

### Добавление контента в переводы

Для перевода основного контента нужно:
1. Добавить ключи в JSON-файл (например, `about_title`, `about_content`)
2. Обновить `process-templates` для замены контента (аналогично title/meta description)
