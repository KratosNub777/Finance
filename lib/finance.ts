export type TransactionKind = "income" | "expense";

export type Transaction = {
  id: string;
  kind: TransactionKind;
  amount: number;
  category: string;
  date: string;
  note?: string;
};

export type Budget = {
  id: string;
  month: string;
  category: string;
  amount: number;
};

export type AppData = {
  transactions: Transaction[];
  budgets: Budget[];
  isDemo: boolean;
};

export type TrendMonth = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export const expenseCategories = [
  "Vivienda",
  "Comer fuera",
  "Supermercado",
  "Servicios",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Compras",
  "Otros",
];

export const incomeCategories = [
  "Salario",
  "Trabajo independiente",
  "Inversiones",
  "Otros ingresos",
];

export const categoryColors: Record<string, string> = {
  Vivienda: "#7F8FF5",
  "Comer fuera": "#F5BE67",
  Supermercado: "#6FE7C2",
  Servicios: "#7CC8EF",
  Transporte: "#B28AF2",
  Salud: "#F28B82",
  Entretenimiento: "#F39BC8",
  Compras: "#A7BDD6",
  Otros: "#65748A",
  Salario: "#6FE7C2",
  "Trabajo independiente": "#7CC8EF",
  Inversiones: "#B28AF2",
  "Otros ingresos": "#A7BDD6",
};

export const currentMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export function monthKeyForDate(date: string) {
  return date.slice(0, 7);
}

export function isValidISODate(value: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)?.slice(1).map(Number);
  if (!parts) return false;
  const [year, month, day] = parts;
  const candidate = new Date(0);
  candidate.setUTCHours(0, 0, 0, 0);
  candidate.setUTCFullYear(year, month - 1, day);
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function shiftMonth(month: string, amount: number) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + amount, 1);
  return currentMonthKey(date);
}

export function monthDate(month: string) {
  return new Date(`${month}-01T12:00:00`);
}

export function formatMonth(month: string, short = false) {
  return monthDate(month).toLocaleDateString("es-MX", {
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
  });
}

// Cambia estos dos valores para usar otra moneda (código ISO 4217) y formato numérico (p. ej. "ARS" con "es-AR").
export const CURRENCY = "USD";
export const MONEY_LOCALE = "en-US";

export function formatMoney(amount: number, decimals = 0) {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(date: string, includeYear = false) {
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

export function totalsForMonth(transactions: Transaction[], month: string) {
  return transactions.reduce(
    (totals, transaction) => {
      if (monthKeyForDate(transaction.date) !== month) return totals;
      if (transaction.kind === "income") totals.income += transaction.amount;
      else totals.expense += transaction.amount;
      return totals;
    },
    { income: 0, expense: 0 },
  );
}

export function totalBudgetForMonth(budgets: Budget[], month: string) {
  return budgets.reduce(
    (sum, budget) => sum + (budget.month === month ? budget.amount : 0),
    0,
  );
}

export function spendingByCategory(transactions: Transaction[], month: string) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (
      transaction.kind !== "expense" ||
      monthKeyForDate(transaction.date) !== month
    )
      continue;
    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + transaction.amount,
    );
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      color: categoryColors[category] ?? categoryColors.Otros,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function lastSixMonths(
  transactions: Transaction[],
  month: string,
): TrendMonth[] {
  return Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonth(month, index - 5);
    const totals = totalsForMonth(transactions, key);
    return {
      key,
      label: formatMonth(key, true).replace(".", ""),
      income: totals.income,
      expense: totals.expense,
    };
  });
}

export function readableInsights(
  transactions: Transaction[],
  budgets: Budget[],
  month: string,
  now = new Date(),
) {
  const messages: {
    title: string;
    detail: string;
    tone: "warning" | "positive" | "neutral";
  }[] = [];
  const categorySpend = spendingByCategory(transactions, month);
  for (const item of categorySpend) {
    const planned =
      budgets.find(
        (budget) => budget.month === month && budget.category === item.category,
      )?.amount ?? 0;
    if (!planned) continue;
    if (item.amount > planned) {
      const above = Math.round(((item.amount - planned) / planned) * 100);
      messages.push({
        title: `${item.category} está un ${above} % por encima del presupuesto`,
        detail: `Vas ${formatMoney(item.amount - planned)} por encima de tu plan de ${formatMoney(planned)}.`,
        tone: "warning",
      });
    }
  }

  const [year, monthIndex] = month.split("-").map(Number);
  const cutoff =
    month === currentMonthKey(now)
      ? now.getDate()
      : new Date(year, monthIndex, 0).getDate();
  const previous = shiftMonth(month, -1);
  const throughDay = (monthKey: string) =>
    transactions.reduce((sum, transaction) => {
      if (
        transaction.kind !== "expense" ||
        monthKeyForDate(transaction.date) !== monthKey
      )
        return sum;
      return Number(transaction.date.slice(8, 10)) <= cutoff
        ? sum + transaction.amount
        : sum;
    }, 0);
  const thisPeriod = throughDay(month);
  const lastPeriod = throughDay(previous);
  if (lastPeriod > 0) {
    const difference = Math.round(
      (Math.abs(thisPeriod - lastPeriod) / lastPeriod) * 100,
    );
    const lower = thisPeriod <= lastPeriod;
    messages.push({
      title: `Tu gasto va un ${difference} % ${lower ? "por debajo" : "por encima"} del mes pasado`,
      detail: `Llevas ${formatMoney(thisPeriod)} en ${formatMonth(month)} y ${formatMoney(lastPeriod)} en el mismo periodo anterior.`,
      tone: lower ? "positive" : "neutral",
    });
  }

  const totals = totalsForMonth(transactions, month);
  const planned = totalBudgetForMonth(budgets, month);
  if (!messages.length && planned > 0) {
    messages.push({
      title: "Vas al ritmo de tu plan",
      detail: `Has usado ${Math.round((totals.expense / planned) * 100)} % de tu presupuesto mensual.`,
      tone: "positive",
    });
  }
  if (!messages.length) {
    messages.push({
      title: "Tu espacio está listo para empezar",
      detail: "Agrega un movimiento para ver cómo evoluciona tu dinero.",
      tone: "neutral",
    });
  }
  return messages.slice(0, 4);
}

const demoExpenses = [1737, 330, 210.72, 105.36, 92.19, 35, 54, 46.66, 23];
const monthlyTotals = [2946.48, 2844.48, 2809.48, 2877.48, 3016.48, 2633.93];
const monthlyIncome = [5080, 5760, 5140, 6000, 5220, 5250];
const demoBudgets = [2200, 250, 400, 300, 350, 180, 250, 200, 90];
const demoNotes = [
  "Renta",
  "Lilia · cena",
  "Whole Foods Market",
  "Recibo de luz",
  "Uber",
  "CityMD · copago",
  "Alamo Drafthouse",
  "Compra del mes",
  "Varios",
];

export function createDemoData(now = new Date()): AppData {
  const latestMonth = currentMonthKey(now);
  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];
  for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
    const month = shiftMonth(latestMonth, monthIndex - 5);
    const [year, monthNumber] = month.split("-").map(Number);
    const anchor = monthIndex === 5;
    const expenseTotal = monthlyTotals[monthIndex];
    const categoryAmounts = anchor
      ? demoExpenses
      : demoExpenses.map((amount, categoryIndex) => {
          const scaled = (expenseTotal * amount) / monthlyTotals[5];
          return categoryIndex === demoExpenses.length - 1
            ? Number(
                (
                  expenseTotal -
                  demoExpenses
                    .slice(0, -1)
                    .reduce(
                      (sum, prior) =>
                        sum + (expenseTotal * prior) / monthlyTotals[5],
                      0,
                    )
                ).toFixed(2),
              )
            : Number(scaled.toFixed(2));
        });
    const day = "05";
    transactions.push({
      id: `sample-income-${month}`,
      kind: "income",
      amount: monthlyIncome[monthIndex],
      category: "Salario",
      date: `${year}-${String(monthNumber).padStart(2, "0")}-${day}`,
      note: "Ingreso mensual de ejemplo",
    });
    expenseCategories.forEach((category, categoryIndex) => {
      const lateSeptemberAmount =
        monthIndex === 4 && categoryIndex === 0 ? 204.48 : 0;
      transactions.push({
        id: `sample-expense-${month}-${categoryIndex}`,
        kind: "expense",
        amount: Number(
          (categoryAmounts[categoryIndex] - lateSeptemberAmount).toFixed(2),
        ),
        category,
        date: `${year}-${String(monthNumber).padStart(2, "0")}-${day}`,
        note: demoNotes[categoryIndex],
      });
      if (lateSeptemberAmount)
        transactions.push({
          id: `sample-expense-${month}-late-${categoryIndex}`,
          kind: "expense",
          amount: lateSeptemberAmount,
          category,
          date: `${year}-${String(monthNumber).padStart(2, "0")}-25`,
          note: "Renta · segunda parte",
        });
      budgets.push({
        id: `sample-budget-${month}-${categoryIndex}`,
        month,
        category,
        amount: demoBudgets[categoryIndex],
      });
    });
  }
  return { transactions, budgets, isDemo: true };
}

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
