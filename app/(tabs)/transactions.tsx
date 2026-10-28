import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { monthTransactions, useFinance } from "@/lib/AppContext";
import type { TransactionDraft } from "@/lib/AppContext";
import { formatMoney, totalsForMonth, type Transaction } from "@/lib/finance";
import {
  ActionButton,
  C,
  Card,
  Header,
  LoadingState,
  MonthBar,
  Screen,
} from "@/components/ui";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionFormModal } from "@/components/TransactionFormModal";

export default function TransactionsScreen() {
  const {
    transactions,
    month,
    ready,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const totals = useMemo(
    () => totalsForMonth(transactions, month),
    [transactions, month],
  );
  const list = useMemo(
    () =>
      monthTransactions(
        transactions,
        month,
        filter === "all" ? undefined : filter,
      )
        .filter((item) =>
          `${item.category} ${item.note ?? ""}`
            .toLocaleLowerCase("es-MX")
            .includes(query.trim().toLocaleLowerCase("es-MX")),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month, filter, query],
  );
  if (!ready) return <LoadingState />;

  const openNew = () => {
    setEditing(null);
    setModal(true);
  };
  const openEdit = (item: Transaction) => {
    setEditing(item);
    setModal(true);
  };
  const remove = (item: Transaction) => {
    const perform = () => deleteTransaction(item.id);
    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm(
          `¿Eliminar “${item.note || item.category}”? Esta acción no se puede deshacer.`,
        )
      )
        perform();
    } else
      Alert.alert(
        "Eliminar movimiento",
        `¿Eliminar “${item.note || item.category}”?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: perform },
        ],
      );
  };
  const save = (draft: TransactionDraft) =>
    editing ? updateTransaction(editing.id, draft) : addTransaction(draft);

  return (
    <>
      <Screen>
        <Header
          title="Movimientos"
          subtitle="Cada entrada y salida, en un solo lugar."
        />
        <MonthBar
          right={
            <ActionButton title="Agregar" onPress={openNew} icon="add" small />
          }
        />
        <View style={{ flexDirection: "row", gap: 9 }}>
          <Summary
            amount={totals.income}
            label="Ingresos"
            color={C.mint}
            icon="arrow-down-outline"
          />
          <Summary
            amount={totals.expense}
            label="Gastos"
            color={C.coral}
            icon="arrow-up-outline"
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 46,
            gap: 9,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
          }}
        >
          <Ionicons name="search-outline" size={18} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar categoría o nota"
            placeholderTextColor={C.faint}
            style={{
              flex: 1,
              color: C.text,
              fontSize: 13,
              outlineStyle: "none" as never,
            }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 7 }}>
          {(["all", "income", "expense"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: filter === value ? "#6FE7C21C" : C.surface,
                borderWidth: 1,
                borderColor: filter === value ? "#4DAF94" : C.border,
              }}
            >
              <Text
                style={{
                  color: filter === value ? C.mint : C.muted,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {value === "all"
                  ? "Todos"
                  : value === "income"
                    ? "Ingresos"
                    : "Gastos"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
              Historial del mes
            </Text>
            <Text style={{ color: C.muted, fontSize: 11 }}>
              {list.length} {list.length === 1 ? "movimiento" : "movimientos"}
            </Text>
          </View>
          {list.length ? (
            list.map((item) => (
              <TransactionRow
                key={item.id}
                transaction={item}
                onEdit={() => openEdit(item)}
                onDelete={() => remove(item)}
              />
            ))
          ) : (
            <View style={{ paddingVertical: 30, alignItems: "center", gap: 8 }}>
              <Ionicons name="receipt-outline" size={28} color={C.faint} />
              <Text style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>
                No encontramos movimientos
              </Text>
              <Text
                style={{
                  maxWidth: 230,
                  color: C.muted,
                  textAlign: "center",
                  fontSize: 12,
                  lineHeight: 17,
                }}
              >
                {query
                  ? "Prueba con otra palabra."
                  : "Agrega un ingreso o gasto para empezar a organizar este mes."}
              </Text>
              {!query ? (
                <ActionButton
                  title="Agregar movimiento"
                  onPress={openNew}
                  icon="add"
                  small
                />
              ) : null}
            </View>
          )}
        </Card>
        <Text style={{ color: C.faint, fontSize: 11, textAlign: "center" }}>
          Toca un movimiento para editarlo. Los cambios se guardan en este
          dispositivo.
        </Text>
      </Screen>
      <TransactionFormModal
        visible={modal}
        initial={editing}
        onClose={() => setModal(false)}
        onSave={save}
      />
    </>
  );
}

function Summary({
  amount,
  label,
  color,
  icon,
}: {
  amount: number;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card
      padding={13}
      style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <Ionicons name={icon} size={17} color={color} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ color, fontSize: 16, fontWeight: "700" }}
        >
          {formatMoney(amount)}
        </Text>
      </View>
    </Card>
  );
}
