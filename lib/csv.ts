import {
  isValidISODate,
  makeId,
  parseAmount,
  type Transaction,
} from "./finance";

const HEADERS = ["fecha", "tipo", "importe", "categoria", "nota"];

function csvEscape(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function transactionsToCSV(transactions: Transaction[]) {
  const lines = [HEADERS.join(",")];
  for (const transaction of transactions) {
    lines.push(
      [
        transaction.date,
        transaction.kind === "income" ? "ingreso" : "gasto",
        String(transaction.amount),
        transaction.category,
        transaction.note ?? "",
      ]
        .map((field) => csvEscape(String(field)))
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

function parseRows(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = source.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function normalizedHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-MX")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parseTransactionsCSV(source: string) {
  const rows = parseRows(source);
  if (rows.length < 2)
    throw new Error("El CSV no contiene movimientos para importar.");
  const headers = rows[0].map(normalizedHeader);
  const findColumn = (...aliases: string[]) =>
    headers.findIndex((header) => aliases.includes(header));
  const columns = {
    date: findColumn("fecha", "date"),
    kind: findColumn("tipo", "type", "movimiento"),
    amount: findColumn("importe", "monto", "amount", "valor"),
    category: findColumn("categoria", "category"),
    note: findColumn("nota", "note", "descripcion", "description", "concepto"),
  };
  if (
    [columns.date, columns.kind, columns.amount, columns.category].some(
      (index) => index < 0,
    )
  ) {
    throw new Error(
      "Faltan columnas obligatorias: fecha, tipo, importe y categoría.",
    );
  }

  const transactions: Transaction[] = [];
  let rejected = 0;
  for (const row of rows.slice(1)) {
    const date = row[columns.date]?.trim() ?? "";
    const type = normalizedHeader(row[columns.kind] ?? "");
    const kind = ["ingreso", "income", "entrada"].includes(type)
      ? "income"
      : ["gasto", "expense", "salida"].includes(type)
        ? "expense"
        : null;
    const amount = parseAmount(row[columns.amount] ?? "");
    const category = row[columns.category]?.trim() ?? "";
    const validDate = isValidISODate(date);
    if (
      !kind ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !category ||
      !validDate
    ) {
      rejected += 1;
      continue;
    }
    transactions.push({
      id: makeId(),
      kind,
      amount,
      category,
      date,
      note:
        columns.note >= 0 ? row[columns.note]?.trim() || undefined : undefined,
    });
  }
  return { transactions, rejected };
}
