# Swedbank API Backend

Express.js API для приложения Swedbank, развернутый на Vercel с использованием Vercel KV (Redis) для хранения данных.

## Установка

```bash
npm install
```

## Развертывание на Vercel

### Шаг 1: Установи Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Войди в аккаунт

```bash
vercel login
```

### Шаг 3: Разверни проект

```bash
cd vercel_backend
vercel
```

### Шаг 4: Добавь Vercel KV базу данных

1. Перейди на https://vercel.com/dashboard
2. Выбери свой проект
3. Перейди в раздел **Storage**
4. Нажми **Create Database**
5. Выбери **KV (Redis)**
6. Введи имя: `swedbank-kv`
7. Нажми **Create**
8. Vercel автоматически добавит переменные окружения:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Шаг 5: Redeploy

После добавления KV базы данных, сделай redeploy:

```bash
vercel --prod
```

## Локальный запуск (для разработки)

Для локального тестирования тебе понадобятся переменные окружения от Vercel KV.

1. Получи переменные из Vercel Dashboard → Settings → Environment Variables
2. Создай файл `.env`:

```bash
KV_URL=your_kv_url_here
KV_REST_API_URL=your_rest_api_url_here
KV_REST_API_TOKEN=your_token_here
KV_REST_API_READ_ONLY_TOKEN=your_readonly_token_here
```

3. Запусти сервер:

```bash
npm run dev
```

Сервер запустится на http://localhost:3001

## Бесплатный Hobby лимит

Vercel KV бесплатен для Hobby плана:
- 1 база данных
- 30,000 запросов/месяц
- 256 MB хранилище
- 256 MB трафик/месяц

## API Endpoints

### GET /api/health
Health check - проверка работоспособности API

### GET /api/sync
Получить все данные (баланс, расходы, транзакции)

### GET /api/balance
Получить только баланс и расходы за месяц

### PUT /api/balance
Обновить баланс и расходы
```json
{
  "balance": 2000.50,
  "monthlySpend": 450.00
}
```

### GET /api/transactions
Получить все транзакции

### POST /api/transactions
Добавить новую транзакцию
```json
{
  "amount": -15.50,
  "date": "16.11.2025 10:30",
  "description": "MAXIMA LV R091 Riga LV",
  "details": "",
  "category": "expense"
}
```

### PUT /api/transactions/:id
Обновить транзакцию

### DELETE /api/transactions/:id
Удалить транзакцию

### GET /api/stats
Получить статистику

## Структура проекта

```
vercel_backend/
├── api/
│   ├── index.js        # Express сервер и роуты
│   └── Database.js     # Класс для работы с Vercel KV
├── public/
│   └── index.html      # Админ панель
├── package.json
├── vercel.json         # Конфигурация Vercel
└── README.md
```

## Особенности

- **Vercel KV (Redis)** - быстрое хранилище данных
- CORS включен для всех источников
- Автоматический расчет monthlySpend при изменении транзакций
- Автоматическое обновление баланса при добавлении/удалении транзакций
- Генерация уникальных ID для транзакций
- Обработка ошибок с понятными сообщениями
- Темная админ панель для управления данными
