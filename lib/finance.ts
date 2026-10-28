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

// Cambia estos dos valores para usar otra moneda (código ISO 4217) y formato numérico.
// Los importes se manejan sin decimales: sirve para guaraníes (PYG); para monedas con centavos habría que reintroducirlos.
export const CURRENCY = "PYG";
export const MONEY_LOCALE = "es-PY";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

// Acepta "150000", "150.000" o "Gs. 150.000": sin decimales, los puntos y comas son separadores de miles.
// shortcut: un final ",50" o ".5" (1-2 dígitos) se toma como decimal y se redondea, así que "1.5" son 2 Gs.; subir si hay monedas con centavos.
export function parseAmount(value: string) {
  const clean = value.replace(/[^\d.,]/g, "");
  const decimal = /^(.*?)[.,](\d{1,2})$/.exec(clean);
  return Math.round(
    Number(
      decimal
        ? `${decimal[1].replace(/[.,]/g, "")}.${decimal[2]}`
        : clean.replace(/[.,]/g, ""),
    ),
  );
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

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
