import React, { useMemo, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFinance, monthTransactions } from "@/lib/AppContext";
import {
  formatMoney,
  formatMonth,
  lastSixMonths,
  readableInsights,
  spendingByCategory,
  totalBudgetForMonth,
  totalsForMonth,
  type Transaction,
} from "@/lib/finance";
import type { TransactionDraft } from "@/lib/AppContext";
import {
  ActionButton,
  C,
  Card,
  Eyebrow,
  Header,
  IconBadge,
  LoadingState,
  MonthBar,
  Screen,
  SectionTitle,
} from "@/components/ui";
import { DonutChart, TrendChart } from "@/components/charts";
import { TransactionRow } from "@/components/TransactionRow";
import { TransactionFormModal } from "@/components/TransactionFormModal";

function StatCard({
  label,
  amount,
  note,
  color,
  icon,
}: {
  label: string;
  amount: number;
  note: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 98,
        backgroundColor: C.surface,
        borderColor: C.border,
        borderWidth: 1,
        borderRadius: 17,
        padding: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            color: C.muted,
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color, fontSize: 17, fontWeight: "700", letterSpacing: -0.4 }}
      >
        {formatMoney(amount)}
      </Text>
      <Text numberOfLines={1} style={{ color: C.faint, fontSize: 9 }}>
        {note}
      </Text>
    </View>
  );
}

export default function OverviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const {
    transactions,
    budgets,
    month,
    setMonth,
    ready,
    storageError,
    retryPersistence,
    addTransaction,
    updateTransaction,
  } = useFinance();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { income, expense } = useMemo(
    () => totalsForMonth(transactions, month),
    [transactions, month],
  );
  const plan = useMemo(
    () => totalBudgetForMonth(budgets, month),
    [budgets, month],
  );
  const remaining = plan - expense;
  const categories = useMemo(
    () => spendingByCategory(transactions, month),
    [transactions, month],
  );
  const trend = useMemo(
    () => lastSixMonths(transactions, month),
    [transactions, month],
  );
  const insights = useMemo(
    () => readableInsights(transactions, budgets, month),
    [transactions, budgets, month],
  );
  const recent = useMemo(
    () =>
      monthTransactions(transactions, month)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions, month],
  );
  const wide = width > 760;
  const cardWidth = wide ? ("48%" as const) : ("100%" as const);
  const saveTransaction = (draft: TransactionDraft) =>
    editing ? updateTransaction(editing.id, draft) : addTransaction(draft);
  const add = () => {
    setEditing(null);
    setAddOpen(true);
  };
  const edit = (item: Transaction) => {
    setEditing(item);
    setAddOpen(true);
  };
  if (!ready) return <LoadingState />;

  return (
    <>
      <Screen>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <IconBadge
              name="wallet-outline"
              color={C.mint}
              size={39}
              background="#6FE7C21A"
            />
            <View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 17,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                pocketwise
              </Text>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 9,
                  letterSpacing: 1.4,
                  fontWeight: "700",
                }}
              >
                TU ESPACIO PERSONAL
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: C.surface,
              borderColor: C.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 7,
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              color={C.mint}
              size={14}
            />
            <Text style={{ color: C.muted, fontSize: 10, fontWeight: "600" }}>
              Solo en tu dispositivo
            </Text>
          </View>
        </View>
        <View style={{ gap: 5, marginTop: 2 }}>
          <Eyebrow>TU PANORAMA FINANCIERO</Eyebrow>
          <Header
            title="Tu dinero, en foco."
            subtitle="Una vista clara de lo que entra, sale y queda."
          />
        </View>
        <MonthBar
          right={
            <ActionButton title="Agregar" icon="add" onPress={add} small />
          }
        />

        {storageError ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              padding: 12,
              borderRadius: 13,
              backgroundColor: "#3A2229",
              borderWidth: 1,
              borderColor: "#73414A",
            }}
          >
            <Ionicons name="alert-circle-outline" color={C.coral} size={18} />
            <Text
              accessibilityRole="alert"
              style={{ color: C.text, flex: 1, fontSize: 11, lineHeight: 16 }}
            >
              {storageError}
            </Text>
            <Pressable
              onPress={retryPersistence}
              accessibilityRole="button"
              accessibilityLabel="Reintentar guardado local"
            >
              <Text style={{ color: C.mint, fontSize: 11, fontWeight: "700" }}>
                Reintentar
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: "#152A39",
            borderWidth: 1,
            borderColor: "#2D655E",
            borderRadius: 22,
            padding: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -46,
              right: -32,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: "#6FE7C20C",
            }}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Eyebrow>TE QUEDA DESPUÉS DE GASTAR</Eyebrow>
            <IconBadge
              name="wallet"
              color={C.mint}
              size={34}
              background="#6FE7C21C"
            />
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              color: C.text,
              fontSize: 36,
              lineHeight: 44,
              fontWeight: "700",
              letterSpacing: -1.2,
              marginTop: 8,
            }}
          >
            {formatMoney(income - expense)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 7,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: C.mint,
                }}
              />
              <Text
                style={{
                  color: C.muted,
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {formatMonth(month)}
              </Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 11 }}>
              Ingresos menos gastos
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <StatCard
            label="INGRESOS"
            amount={income}
            note="Dinero que entró"
            color={C.text}
            icon="arrow-down-outline"
          />
          <StatCard
            label="GASTADO"
            amount={expense}
            note={`${categories.length} categorías`}
            color={C.text}
            icon="arrow-up-outline"
          />
          <StatCard
            label="DISPONIBLE"
            amount={Math.max(remaining, 0)}
            note={
              remaining < 0
                ? `${formatMoney(Math.abs(remaining))} excedido`
                : `${plan > 0 ? Math.round((expense / plan) * 100) : 0}% del plan`
            }
            color={remaining < 0 ? C.coral : C.mint}
            icon="pulse-outline"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 14,
          }}
        >
          <Card style={{ width: cardWidth }}>
            <Eyebrow>EL PANORAMA</Eyebrow>
            <SectionTitle
              title="Flujo de caja"
              note="Seis meses de ingresos y gastos"
            />
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 6 }}>
              <Legend color={C.mint} label="Ingresos" />
              <Legend color="#9A8BF3" label="Gastos" />
            </View>
            <TrendChart data={trend} />
          </Card>
          <Card style={{ width: cardWidth }}>
            <Eyebrow>EN QUÉ SE FUE</Eyebrow>
            <SectionTitle
              title="Gasto por categoría"
              note="Distribución de este mes"
            />
            {categories.length ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <DonutChart
                  total={expense}
                  segments={categories.map((item) => ({
                    amount: item.amount,
                    color: item.color,
                  }))}
                  size={136}
                />
                <View style={{ flex: 1, gap: 10 }}>
                  {categories.slice(0, 5).map((item) => (
                    <View
                      key={item.category}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: item.color,
                        }}
                      />
                      <Text
                        numberOfLines={1}
                        style={{ flex: 1, color: C.muted, fontSize: 10 }}
                      >
                        {item.category}
                      </Text>
                      <Text
                        style={{
                          color: C.text,
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {expense > 0
                          ? Math.round((item.amount / expense) * 100)
                          : 0}
                        %
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState
                icon="pie-chart-outline"
                title="Aún no hay gastos"
                detail="Agrega un movimiento para ver aquí tus categorías."
              />
            )}
            <Pressable
              onPress={() => router.push("/(tabs)/budgets")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                alignSelf: "flex-end",
                marginTop: 9,
              }}
            >
              <Text style={{ color: C.mint, fontSize: 11, fontWeight: "700" }}>
                Ver presupuestos
              </Text>
              <Ionicons name="arrow-forward" size={13} color={C.mint} />
            </Pressable>
          </Card>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 14,
          }}
        >
          <Card style={{ width: cardWidth }}>
            <Eyebrow>UNA MIRADA MÁS</Eyebrow>
            <SectionTitle
              title="Vale la pena saber"
              action={
                <Pressable onPress={() => router.push("/(tabs)/insights")}>
                  <Text
                    style={{ color: C.mint, fontSize: 11, fontWeight: "700" }}
                  >
                    Ver todo
                  </Text>
                </Pressable>
              }
            />
            <View style={{ gap: 9 }}>
              {insights.slice(0, 2).map((item) => (
                <InsightTile
                  key={item.title}
                  title={item.title}
                  detail={item.detail}
                  tone={item.tone}
                />
              ))}
            </View>
          </Card>
          <Card style={{ width: cardWidth }}>
            <SectionTitle
              title="Actividad reciente"
              action={
                <Pressable onPress={() => router.push("/(tabs)/transactions")}>
                  <Text
                    style={{ color: C.mint, fontSize: 11, fontWeight: "700" }}
                  >
                    Ver todo
                  </Text>
                </Pressable>
              }
            />
            {recent.length ? (
              recent.map((item) => (
                <TransactionRow
                  key={item.id}
                  transaction={item}
                  onEdit={() => edit(item)}
                />
              ))
            ) : (
              <EmptyState
                icon="receipt-outline"
                title="Sin movimientos todavía"
                detail="Registra tu primer ingreso o gasto."
              />
            )}
            {!recent.length ? (
              <ActionButton
                title="Agregar movimiento"
                onPress={add}
                icon="add"
                secondary
                small
              />
            ) : null}
          </Card>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 4,
          }}
        >
          <Ionicons name="lock-closed-outline" size={13} color={C.faint} />
          <Text style={{ color: C.faint, fontSize: 10 }}>
            Privado por diseño · guardado en este dispositivo
          </Text>
        </View>
      </Screen>
      <TransactionFormModal
        visible={addOpen}
        initial={editing}
        onClose={() => setAddOpen(false)}
        onSave={saveTransaction}
      />
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: color }}
      />
      <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}
function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6, paddingVertical: 18 }}>
      <Ionicons name={icon} size={25} color={C.faint} />
      <Text style={{ color: C.text, fontSize: 13, fontWeight: "600" }}>
        {title}
      </Text>
      <Text
        style={{
          maxWidth: 220,
          color: C.muted,
          fontSize: 11,
          textAlign: "center",
          lineHeight: 16,
        }}
      >
        {detail}
      </Text>
    </View>
  );
}
function InsightTile({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "warning" | "positive" | "neutral";
}) {
  const color =
    tone === "warning" ? C.amber : tone === "positive" ? C.mint : C.blue;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 13,
        backgroundColor: C.raised,
      }}
    >
      <IconBadge
        name={
          tone === "warning"
            ? "alert-circle-outline"
            : tone === "positive"
              ? "sparkles-outline"
              : "information-circle-outline"
        }
        color={color}
        size={31}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: C.text, fontSize: 11, fontWeight: "600" }}>
          {title}
        </Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15 }}>
          {detail}
        </Text>
      </View>
    </View>
  );
}
