import { describe, expect, it } from "vitest";
import {
  formatMoney,
  isValidISODate,
  parseAmount,
  readableInsights,
  totalBudgetForMonth,
  totalsForMonth,
  type Budget,
  type Transaction,
} from "../lib/finance";
import { parseTransactionsCSV, transactionsToCSV } from "../lib/csv";

const expense = (
  id: string,
  date: string,
  amount: number,
  category = "Comer fuera",
): Transaction => ({ id, kind: "expense", amount, category, date });

describe("Pocketwise finance helpers", () => {
  it("rejects impossible calendar days without changing the selected month", () => {
    expect(isValidISODate("2024-02-29")).toBe(true);
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("26-02-01")).toBe(false);
  });

  it("formats guaraníes without decimals and reads thousands separators", () => {
    expect(formatMoney(1586000)).toMatch(/^Gs\.\s1\.586\.000$/);
    expect(parseAmount("150000")).toBe(150000);
    expect(parseAmount("150.000")).toBe(150000);
    expect(parseAmount("Gs. 1.500.000")).toBe(1500000);
    expect(parseAmount("abc")).toBe(0);
  });

  it("totals a month and warns when a category exceeds its budget", () => {
    const now = new Date(2026, 9, 23);
    const transactions: Transaction[] = [
      {
        id: "i",
        kind: "income",
        amount: 5000000,
        category: "Salario",
        date: "2026-10-05",
      },
      expense("a", "2026-10-10", 330000),
      expense("b", "2026-09-10", 400000),
    ];
    const budgets: Budget[] = [
      { id: "b1", month: "2026-10", category: "Comer fuera", amount: 250000 },
    ];
    expect(totalsForMonth(transactions, "2026-10")).toEqual({
      income: 5000000,
      expense: 330000,
    });
    expect(totalBudgetForMonth(budgets, "2026-10")).toBe(250000);
    const insights = readableInsights(transactions, budgets, "2026-10", now);
    expect(insights[0].title).toBe(
      "Comer fuera está un 32 % por encima del presupuesto",
    );
    expect(insights[1].title).toBe(
      "Tu gasto va un 18 % por debajo del mes pasado",
    );
  });

  it("round-trips CSV including commas, quotes, and accented category names", () => {
    const transaction = {
      ...expense("test-1", "2026-10-22", 42350),
      note: 'Cena, "con amistades"',
    };
    const csv = transactionsToCSV([transaction]);
    const imported = parseTransactionsCSV(csv);
    expect(imported.rejected).toBe(0);
    expect(imported.transactions).toHaveLength(1);
    expect(imported.transactions[0]).toMatchObject({
      amount: 42350,
      category: "Comer fuera",
      date: "2026-10-22",
      note: transaction.note,
    });
  });

  it("skips invalid rows without dropping valid movements", () => {
    const csv =
      "fecha,tipo,importe,categoría,nota\n2026-10-22,gasto,10.000,Vivienda,Renta\n2026-02-31,gasto,5000,Otros,Fecha inválida";
    const parsed = parseTransactionsCSV(csv);
    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.transactions[0].amount).toBe(10000);
    expect(parsed.rejected).toBe(1);
  });
});
