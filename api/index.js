const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./Database');

const app = express();
const db = new Database();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Инициализация БД
db.ensureDatabaseExists().catch(console.error);

// ============================================================================
// API ROUTES
// ============================================================================

// GET /api/sync - Получить все данные
app.get('/api/sync', async (req, res) => {
  try {
    const data = await db.readData();
    res.json({
      success: true,
      data: {
        balance: data.balance,
        monthlySpend: data.monthlySpend,
        transactions: data.transactions,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// GET /api/balance - Получить баланс
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await db.getBalance();
    res.json({
      success: true,
      balance: balance.balance,
      monthlySpend: balance.monthlySpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// PUT /api/balance - Обновить баланс и расходы
app.put('/api/balance', async (req, res) => {
  try {
    const { balance, monthlySpend } = req.body;

    if (balance === undefined || isNaN(parseFloat(balance))) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат баланса'
      });
    }

    const newMonthlySpend = monthlySpend !== undefined && !isNaN(parseFloat(monthlySpend))
      ? parseFloat(monthlySpend)
      : null;

    await db.updateBalance(parseFloat(balance), newMonthlySpend);
    const updatedBalance = await db.getBalance();

    res.json({
      success: true,
      balance: updatedBalance.balance,
      monthlySpend: updatedBalance.monthlySpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// GET /api/transactions - Получить все транзакции
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await db.getTransactions();
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// POST /api/transactions - Добавить транзакцию
app.post('/api/transactions', async (req, res) => {
  try {
    const data = req.body;

    if (data.amount === undefined || isNaN(parseFloat(data.amount))) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат суммы'
      });
    }

    if (!data.date) {
      return res.status(400).json({
        success: false,
        error: 'Не указана дата'
      });
    }

    const transaction = {
      amount: parseFloat(data.amount),
      date: data.date,
      description: data.description || (data.amount > 0 ? 'Пополнение' : 'Расход'),
      details: data.details || '',
      category: data.category || (data.amount > 0 ? 'income' : 'expense'),
      accountId: data.accountId || 'acc_chk',
      type: data.type || (data.amount > 0 ? 'deposit' : 'payment')
    };

    const result = await db.addTransaction(transaction);

    res.json({
      success: true,
      transaction: result.transaction,
      balance: result.balance,
      monthlySpend: result.monthlySpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// PUT /api/transactions/:id - Обновить транзакцию
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.amount !== undefined) {
      updates.amount = parseFloat(updates.amount);
    }

    const result = await db.updateTransaction(id, updates);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      transaction: result.transaction,
      balance: result.balance,
      monthlySpend: result.monthlySpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// DELETE /api/transactions/:id - Удалить транзакцию
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteTransaction(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      deletedTransaction: result.deletedTransaction,
      balance: result.balance,
      monthlySpend: result.monthlySpend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// GET /api/stats - Получить статистику
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера: ' + error.message
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint не найден',
    path: req.path,
    method: req.method
  });
});

// Для локального запуска
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Для Vercel
module.exports = app;
