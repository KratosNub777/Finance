import { describe, expect, it } from "vitest";
import {
  createDemoData,
  isValidISODate,
  readableInsights,
  totalBudgetForMonth,
  totalsForMonth,
} from "../lib/finance";
import { parseTransactionsCSV, transactionsToCSV } from "../lib/csv";

describe("Pocketwise finance helpers", () => {
  it("rejects impossible calendar days without changing the selected month", () => {
    expect(isValidISODate("2024-02-29")).toBe(true);
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("26-02-01")).toBe(false);
  });

  it("creates a disclosed example with the 32% dining insight and reference totals", () => {
    const sample = createDemoData(new Date(2026, 9, 23));
    const month = "2026-10";
    const totals = totalsForMonth(sample.transactions, month);
    expect(totals.income).toBe(5250);
    expect(totals.expense).toBeCloseTo(2633.93, 2);
    expect(totalBudgetForMonth(sample.budgets, month)).toBe(4220);
    expect(sample.isDemo).toBe(true);
    expect(
      readableInsights(sample.transactions, sample.budgets, month)[0].title,
    ).toBe("Comer fuera está un 32 % por encima del presupuesto");
    expect(
      readableInsights(sample.transactions, sample.budgets, month)[1].title,
    ).toBe("Tu gasto va un 6 % por debajo del mes pasado");
  });

  it("round-trips CSV including commas, quotes, and accented category names", () => {
    const transaction = {
      id: "test-1",
      kind: "expense" as const,
      amount: 42.35,
      category: "Comer fuera",
      date: "2026-10-22",
      note: 'Cena, "con amistades"',
    };
    const csv = transactionsToCSV([transaction]);
    const imported = parseTransactionsCSV(csv);
    expect(imported.rejected).toBe(0);
    expect(imported.transactions).toHaveLength(1);
    expect(imported.transactions[0]).toMatchObject({
      amount: 42.35,
      category: "Comer fuera",
      date: "2026-10-22",
      note: transaction.note,
    });
  });

  it("skips invalid rows without dropping valid movements", () => {
    const csv =
      "fecha,tipo,importe,categoría,nota\n2026-10-22,gasto,10,Vivienda,Renta\n2026-02-31,gasto,5,Otros,Fecha inválida";
    const parsed = parseTransactionsCSV(csv);
    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.rejected).toBe(1);
  });
});
