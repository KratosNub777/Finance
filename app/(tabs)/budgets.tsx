import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFinance } from "@/lib/AppContext";
import {
  categoryColors,
  expenseCategories,
  formatMoney,
  monthKeyForDate,
  totalBudgetForMonth,
  totalsForMonth,
} from "@/lib/finance";
import {
  ActionButton,
  C,
  Card,
  Header,
  IconBadge,
  LoadingState,
  MonthBar,
  Screen,
  useDesktop,
} from "@/components/ui";
import { BudgetProgress } from "@/components/charts";
import { BudgetEditorModal } from "@/components/BudgetEditorModal";

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Vivienda: "home-outline",
  "Comer fuera": "restaurant-outline",
  Supermercado: "cart-outline",
  Servicios: "flash-outline",
  Transporte: "car-outline",
  Salud: "heart-outline",
  Entretenimiento: "film-outline",
  Compras: "bag-outline",
  Otros: "ellipsis-horizontal-outline",
};

export default function BudgetsScreen() {
  const { transactions, budgets, month, ready, setBudget } = useFinance();
  const desktop = useDesktop();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const currentBudgets = budgets.filter((item) => item.month === month);
  const spending = useMemo(
    () =>
      transactions.reduce((map, item) => {
        if (item.kind === "expense" && monthKeyForDate(item.date) === month)
          map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
        return map;
      }, new Map<string, number>()),
    [transactions, month],
  );
  const planned = totalBudgetForMonth(budgets, month);
  const spent = totalsForMonth(transactions, month).expense;
  const openEditor = (selected?: string) => {
    setCategory(selected);
    setOpen(true);
  };
  const initial = currentBudgets.find((item) => item.category === category);
  if (!ready) return <LoadingState />;

  return (
    <>
      <Screen>
        <Header
          title="Presupuestos"
          subtitle="Define un plan y mira cómo vas en cada categoría."
        />
        <MonthBar
          right={
            <ActionButton
              title="Nuevo plan"
              icon="add"
              onPress={() => openEditor()}
              small
            />
          }
        />
        <Card style={{ backgroundColor: "#142A39", borderColor: "#2B5E5B" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ gap: 5 }}>
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                GASTO DEL MES
              </Text>
              <Text style={{ color: C.text, fontSize: 26, fontWeight: "700" }}>
                {formatMoney(spent)}{" "}
                <Text
                  style={{ color: C.muted, fontSize: 15, fontWeight: "500" }}
                >
                  de {formatMoney(planned)}
                </Text>
              </Text>
            </View>
            <IconBadge name="analytics-outline" color={C.mint} size={36} />
          </View>
          <BudgetProgress spent={spent} planned={planned} height={9} />
          <Text
            style={{
              color: spent > planned && planned > 0 ? C.coral : C.mint,
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            {planned > spent
              ? `${formatMoney(planned - spent)} disponibles en el plan`
              : planned > 0
                ? `${formatMoney(spent - planned)} por encima del presupuesto`
                : "Agrega un plan para ver cuánto te queda"}
          </Text>
        </Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 1,
          }}
        >
          <Text style={{ color: C.text, fontSize: 17, fontWeight: "700" }}>
            Por categoría
          </Text>
          <Text style={{ color: C.muted, fontSize: 11 }}>
            {currentBudgets.length} con plan
          </Text>
        </View>
        <View
          style={{
            gap: 9,
            ...(desktop ? { flexDirection: "row", flexWrap: "wrap" } : {}),
          }}
        >
          {expenseCategories.map((name) => {
            const budget =
              currentBudgets.find((item) => item.category === name)?.amount ??
              0;
            const actual = spending.get(name) ?? 0;
            const remaining = budget - actual;
            const color = categoryColors[name] ?? C.mint;
            return (
              <Card
                key={name}
                padding={14}
                style={desktop ? { width: "49.5%" } : undefined}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <IconBadge
                    name={icons[name] ?? "ellipse-outline"}
                    color={color}
                    size={37}
                  />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text
                      style={{ color: C.text, fontSize: 13, fontWeight: "600" }}
                    >
                      {name}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 10 }}>
                      {formatMoney(actual)} gastados{" "}
                      {budget > 0
                        ? `de ${formatMoney(budget)}`
                        : "· sin presupuesto"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 1 }}>
                    <Text
                      style={{
                        color:
                          budget > 0 && remaining < 0
                            ? C.coral
                            : budget > 0
                              ? C.mint
                              : C.muted,
                        fontSize: 13,
                        fontWeight: "700",
                      }}
                    >
                      {budget > 0 ? formatMoney(Math.abs(remaining)) : "—"}
                    </Text>
                    <Text style={{ color: C.faint, fontSize: 9 }}>
                      {budget > 0
                        ? remaining < 0
                          ? "sobre el plan"
                          : "disponibles"
                        : "por definir"}
                    </Text>
                  </View>
                </View>
                {budget > 0 ? (
                  <View style={{ marginTop: 11, gap: 5 }}>
                    <BudgetProgress
                      spent={actual}
                      planned={budget}
                      color={color}
                      height={6}
                    />
                    <Text
                      style={{
                        color: C.faint,
                        fontSize: 9,
                        textAlign: "right",
                      }}
                    >
                      {Math.round((actual / budget) * 100)} % del presupuesto
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: budget > 0 ? 2 : 6,
                  }}
                >
                  <ActionButton
                    title={budget > 0 ? "Ajustar plan" : "Añadir presupuesto"}
                    onPress={() => openEditor(name)}
                    icon="create-outline"
                    small
                    secondary
                  />
                </View>
              </Card>
            );
          })}
        </View>
        <Text
          style={{
            color: C.faint,
            fontSize: 10,
            textAlign: "center",
            lineHeight: 16,
          }}
        >
          Los presupuestos pertenecen al mes seleccionado; cambiar de mes te
          permite consultar o definir otro plan.
        </Text>
      </Screen>
      <BudgetEditorModal
        visible={open}
        monthLabel={month}
        initialCategory={category}
        initialAmount={initial?.amount}
        onClose={() => setOpen(false)}
        onSave={(name, amount) => setBudget(month, name, amount)}
      />
    </>
  );
}
