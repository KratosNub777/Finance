import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  currentMonthKey,
  makeId,
  monthKeyForDate,
  type AppData,
  type Budget,
  type Transaction,
  type TransactionKind,
} from "@/lib/finance";
import { loadLocalData, saveLocalData } from "@/lib/storage";

export type TransactionDraft = Omit<Transaction, "id">;

type FinanceContextValue = {
  transactions: Transaction[];
  budgets: Budget[];
  month: string;
  setMonth: (month: string) => void;
  ready: boolean;
  storageError: string | null;
  retryPersistence: () => void;
  addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (month: string, category: string, amount: number) => void;
  importTransactions: (rows: Transaction[]) => void;
  clearAll: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [month, setMonth] = useState(currentMonthKey());
  const [storageError, setStorageError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadLocalData().then((saved) => {
      if (!active) return;
      setTransactions(saved?.transactions ?? []);
      setBudgets(saved?.budgets ?? []);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const storageSnapshot = useMemo<AppData>(
    () => ({ transactions, budgets }),
    [transactions, budgets],
  );

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void saveLocalData(storageSnapshot).then(
      () => {
        if (active) setStorageError(null);
      },
      () => {
        if (active)
          setStorageError(
            "No pudimos guardar tus últimos cambios de forma local. Podrían perderse al cerrar la app; reintenta cuando el almacenamiento esté disponible.",
          );
      },
    );
    return () => {
      active = false;
    };
  }, [ready, storageSnapshot]);

  const retryPersistence = useCallback(() => {
    void saveLocalData(storageSnapshot).then(
      () => setStorageError(null),
      () =>
        setStorageError(
          "No pudimos guardar tus últimos cambios de forma local. Podrían perderse al cerrar la app; reintenta cuando el almacenamiento esté disponible.",
        ),
    );
  }, [storageSnapshot]);

  const addTransaction = useCallback((draft: TransactionDraft) => {
    setTransactions((items) => [{ ...draft, id: makeId() }, ...items]);
  }, []);
  const updateTransaction = useCallback(
    (id: string, draft: TransactionDraft) => {
      setTransactions((items) =>
        items.map((item) => (item.id === id ? { ...draft, id } : item)),
      );
    },
    [],
  );
  const deleteTransaction = useCallback((id: string) => {
    setTransactions((items) => items.filter((item) => item.id !== id));
  }, []);
  const setBudget = useCallback(
    (monthKey: string, category: string, amount: number) => {
      setBudgets((items) => {
        const existing = items.find(
          (item) => item.month === monthKey && item.category === category,
        );
        if (existing)
          return items.map((item) =>
            item.id === existing.id ? { ...item, amount } : item,
          );
        return [...items, { id: makeId(), month: monthKey, category, amount }];
      });
    },
    [],
  );
  const importTransactions = useCallback((rows: Transaction[]) => {
    setTransactions((items) => [...rows, ...items]);
  }, []);
  const clearAll = useCallback(() => {
    setTransactions([]);
    setBudgets([]);
    setMonth(currentMonthKey());
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      month,
      setMonth,
      ready,
      storageError,
      retryPersistence,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudget,
      importTransactions,
      clearAll,
    }),
    [
      transactions,
      budgets,
      month,
      ready,
      storageError,
      retryPersistence,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudget,
      importTransactions,
      clearAll,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinance debe usarse dentro de FinanceProvider");
  return context;
}

export function monthTransactions(
  transactions: Transaction[],
  month: string,
  kind?: TransactionKind,
) {
  return transactions.filter(
    (transaction) =>
      monthKeyForDate(transaction.date) === month &&
      (!kind || transaction.kind === kind),
  );
}
