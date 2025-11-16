const fs = require('fs').promises;
const path = require('path');

class Database {
  constructor() {
    this.dbFile = path.join(__dirname, '../data/bankData.json');
  }

  async ensureDatabaseExists() {
    try {
      await fs.access(this.dbFile);
    } catch {
      const defaultData = {
        balance: 0.00,
        monthlySpend: 0.00,
        transactions: []
      };
      await this.writeData(defaultData);
    }
  }

  async readData() {
    try {
      const jsonData = await fs.readFile(this.dbFile, 'utf8');
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Error reading database:', error);
      return null;
    }
  }

  async writeData(data) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(this.dbFile, jsonData, 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing database:', error);
      return false;
    }
  }

  async getBalance() {
    const data = await this.readData();
    return {
      balance: data?.balance ?? 0,
      monthlySpend: data?.monthlySpend ?? 0
    };
  }

  async updateBalance(newBalance, newMonthlySpend = null) {
    const data = await this.readData();
    data.balance = Math.round(newBalance * 100) / 100;

    if (newMonthlySpend !== null) {
      data.monthlySpend = Math.round(newMonthlySpend * 100) / 100;
    }

    return await this.writeData(data);
  }

  async getTransactions() {
    const data = await this.readData();
    return data?.transactions ?? [];
  }

  async addTransaction(transaction) {
    const data = await this.readData();

    // Создаем ID если его нет
    if (!transaction.id) {
      transaction.id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Округляем сумму
    transaction.amount = Math.round(transaction.amount * 100) / 100;

    // Устанавливаем значения по умолчанию
    transaction.accountId = transaction.accountId || 'acc_chk';
    transaction.type = transaction.type || (transaction.amount > 0 ? 'deposit' : 'payment');
    transaction.category = transaction.category || (transaction.amount > 0 ? 'income' : 'expense');
    transaction.details = transaction.details || '';

    // Добавляем транзакцию в начало массива
    data.transactions.unshift(transaction);

    // Обновляем баланс
    data.balance = Math.round((data.balance + transaction.amount) * 100) / 100;

    // Пересчитываем расходы за месяц
    data.monthlySpend = this.calculateMonthlySpend(data.transactions);

    await this.writeData(data);

    return {
      transaction,
      balance: data.balance,
      monthlySpend: data.monthlySpend
    };
  }

  async updateTransaction(id, updates) {
    const data = await this.readData();
    let found = false;
    let oldAmount = 0;
    let updatedTx = null;

    for (let i = 0; i < data.transactions.length; i++) {
      if (data.transactions[i].id === id) {
        oldAmount = data.transactions[i].amount;

        // Обновляем поля
        for (const [key, value] of Object.entries(updates)) {
          if (key === 'amount') {
            data.transactions[i][key] = Math.round(value * 100) / 100;
          } else {
            data.transactions[i][key] = value;
          }
        }

        updatedTx = data.transactions[i];
        found = true;
        break;
      }
    }

    if (!found) {
      return null;
    }

    // Если изменилась сумма, обновляем баланс
    if (updates.amount !== undefined) {
      const difference = updates.amount - oldAmount;
      data.balance = Math.round((data.balance + difference) * 100) / 100;
    }

    // Пересчитываем расходы за месяц
    data.monthlySpend = this.calculateMonthlySpend(data.transactions);

    await this.writeData(data);

    return {
      transaction: updatedTx,
      balance: data.balance,
      monthlySpend: data.monthlySpend
    };
  }

  async deleteTransaction(id) {
    const data = await this.readData();
    let deletedTx = null;

    const index = data.transactions.findIndex(tx => tx.id === id);
    if (index !== -1) {
      deletedTx = data.transactions[index];
      data.transactions.splice(index, 1);
    }

    if (!deletedTx) {
      return null;
    }

    // Обновляем баланс (вычитаем сумму удаленной транзакции)
    data.balance = Math.round((data.balance - deletedTx.amount) * 100) / 100;

    // Пересчитываем расходы за месяц
    data.monthlySpend = this.calculateMonthlySpend(data.transactions);

    await this.writeData(data);

    return {
      deletedTransaction: deletedTx,
      balance: data.balance,
      monthlySpend: data.monthlySpend
    };
  }

  calculateMonthlySpend(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let monthlySpend = 0;

    for (const tx of transactions) {
      // Парсим дату транзакции (формат: "13.11.2025 09:53")
      const parts = tx.date.split(' ');
      if (parts.length > 0) {
        const dateParts = parts[0].split('.');
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10);
          const year = parseInt(dateParts[2], 10);

          // Проверяем, что транзакция из текущего месяца и это расход
          if (month === currentMonth && year === currentYear && tx.amount < 0) {
            monthlySpend += Math.abs(tx.amount);
          }
        }
      }
    }

    return Math.round(monthlySpend * 100) / 100;
  }

  async getStats() {
    const data = await this.readData();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of data.transactions) {
      if (tx.amount > 0) {
        totalIncome += tx.amount;
      } else {
        totalExpense += Math.abs(tx.amount);
      }
    }

    return {
      balance: data.balance,
      monthlySpend: data.monthlySpend,
      totalTransactions: data.transactions.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100
    };
  }
}

module.exports = Database;
