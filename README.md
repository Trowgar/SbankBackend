# Swedbank API Backend

Express.js API для приложения Swedbank, развернутый на Vercel.

## Установка

```bash
npm install
```

## Локальный запуск

```bash
npm run dev
```

Сервер запустится на http://localhost:3001

## Развертывание на Vercel

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Войдите в аккаунт:
```bash
vercel login
```

3. Разверните проект:
```bash
vercel
```

4. Для production:
```bash
vercel --prod
```

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
│   └── Database.js     # Класс для работы с JSON базой
├── data/
│   └── bankData.json   # JSON база данных
├── package.json
├── vercel.json         # Конфигурация Vercel
└── README.md
```

## Особенности

- CORS включен для всех источников
- Автоматический расчет monthlySpend при изменении транзакций
- Автоматическое обновление баланса при добавлении/удалении транзакций
- Генерация уникальных ID для транзакций
- Обработка ошибок с понятными сообщениями
