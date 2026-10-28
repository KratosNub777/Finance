import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { monthTransactions, useFinance } from "@/lib/AppContext";
import {
  categoryColors,
  formatMoney,
  readableInsights,
  spendingByCategory,
  totalBudgetForMonth,
  totalsForMonth,
} from "@/lib/finance";
import { parseTransactionsCSV, transactionsToCSV } from "@/lib/csv";
import {
  ActionButton,
  C,
  Card,
  Header,
  IconBadge,
  LoadingState,
  MonthBar,
  Screen,
  SectionTitle,
} from "@/components/ui";
import { BudgetProgress } from "@/components/charts";
import { TrendChart } from "@/components/charts";
import { lastSixMonths } from "@/lib/finance";

export default function InsightsScreen() {
  const {
    transactions,
    budgets,
    month,
    ready,
    storageError,
    retryPersistence,
    importTransactions,
    clearAll,
  } = useFinance();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const insights = useMemo(
    () => readableInsights(transactions, budgets, month),
    [transactions, budgets, month],
  );
  const categories = useMemo(
    () => spendingByCategory(transactions, month),
    [transactions, month],
  );
  const trends = useMemo(
    () => lastSixMonths(transactions, month),
    [transactions, month],
  );
  const totals = useMemo(
    () => totalsForMonth(transactions, month),
    [transactions, month],
  );
  const planned = totalBudgetForMonth(budgets, month);
  if (!ready) return <LoadingState />;

  const notify = (text: string) => {
    setMessage(text);
    if (Platform.OS !== "web") Alert.alert("Pocketwise", text);
  };
  const applyCSV = (text: string) => {
    try {
      const parsed = parseTransactionsCSV(text);
      if (!parsed.transactions.length) {
        notify(
          `No se importó ningún movimiento. ${parsed.rejected} filas no válidas.`,
        );
        return;
      }
      importTransactions(parsed.transactions);
      notify(
        `Importación lista: ${parsed.transactions.length} movimientos añadidos${parsed.rejected ? ` y ${parsed.rejected} filas omitidas por formato inválido` : ""}.`,
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "No pudimos leer ese CSV.",
      );
    }
  };
  const importCSV = async () => {
    setMessage("");
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const input = window.document.createElement("input");
      input.type = "file";
      input.accept = ".csv,text/csv,text/plain,application/vnd.ms-excel";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) applyCSV(await file.text());
      };
      input.click();
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      applyCSV(text);
    } catch {
      notify(
        "No pudimos abrir ese archivo. Prueba con un CSV en formato UTF-8.",
      );
    }
  };
  const exportCSV = async () => {
    if (!transactions.length) {
      notify("Todavía no hay movimientos para exportar.");
      return;
    }
    const csv = transactionsToCSV(transactions);
    const name = `pocketwise-movimientos-${month}.csv`;
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = name;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify(`Archivo ${name} descargado.`);
      return;
    }
    try {
      setBusy(true);
      const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!base) throw new Error("No hay almacenamiento temporal disponible.");
      const uri = `${base}${name}`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(uri, {
          mimeType: "text/csv",
          dialogTitle: "Guardar o compartir tu archivo CSV",
        });
      else notify(`Archivo guardado en ${uri}`);
    } catch {
      notify("No pudimos generar el archivo de respaldo.");
    } finally {
      setBusy(false);
    }
  };
  const clearData = () => {
    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm(
          "Esto eliminará todos los movimientos y presupuestos guardados en este dispositivo. ¿Continuar?",
        )
      ) {
        clearAll();
        setMessage(
          "Datos locales borrados. Tu espacio está listo para tus propios movimientos.",
        );
      }
      return;
    }
    Alert.alert(
      "Borrar datos locales",
      "Se eliminarán los movimientos y presupuestos de este dispositivo. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: () => {
            clearAll();
            setMessage("Tus datos locales se borraron.");
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Header
        title="Análisis"
        subtitle="Pequeñas señales para tomar mejores decisiones."
      />
      <MonthBar />
      {message ? (
        <View
          style={{
            padding: 12,
            borderRadius: 13,
            backgroundColor: "#173A35",
            borderWidth: 1,
            borderColor: "#326A5D",
          }}
        >
          <Text style={{ color: C.mint, fontSize: 12, lineHeight: 18 }}>
            {message}
          </Text>
        </View>
      ) : null}
      {storageError ? (
        <Card style={{ borderColor: "#73414A", backgroundColor: "#3A2229" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
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
        </Card>
      ) : null}
      <Card>
        <SectionTitle title="Vale la pena saber" note={`Lectura de ${month}`} />
        <View style={{ gap: 10 }}>
          {insights.map((item) => {
            const color =
              item.tone === "warning"
                ? C.amber
                : item.tone === "positive"
                  ? C.mint
                  : C.blue;
            return (
              <View
                key={item.title}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 11,
                  borderRadius: 14,
                  backgroundColor: C.raised,
                  padding: 13,
                }}
              >
                <IconBadge
                  name={
                    item.tone === "warning"
                      ? "alert-circle-outline"
                      : item.tone === "positive"
                        ? "sparkles-outline"
                        : "information-circle-outline"
                  }
                  color={color}
                  size={36}
                />
                <View style={{ flex: 1, gap: 5 }}>
                  <Text
                    style={{
                      color: C.text,
                      fontSize: 13,
                      lineHeight: 18,
                      fontWeight: "700",
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}
                  >
                    {item.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
      <Card>
        <SectionTitle
          title="Tu tendencia"
          note="Ingresos y gastos · últimos seis meses"
        />
        <View style={{ flexDirection: "row", gap: 14, marginBottom: 7 }}>
          <Legend color={C.mint} label="Ingresos" />
          <Legend color="#9A8BF3" label="Gastos" />
        </View>
        <TrendChart data={trends} />
      </Card>
      <Card>
        <SectionTitle
          title="Categorías de gasto"
          note={`${formatMoney(totals.expense)} en total · plan ${formatMoney(planned)}`}
        />
        {categories.length ? (
          <View style={{ gap: 15 }}>
            {categories.map((item) => {
              const budget =
                budgets.find(
                  (entry) =>
                    entry.month === month && entry.category === item.category,
                )?.amount ?? 0;
              return (
                <View key={item.category} style={{ gap: 7 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 7,
                        flex: 1,
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
                        style={{
                          color: C.text,
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <Text
                      style={{ color: C.text, fontSize: 12, fontWeight: "700" }}
                    >
                      {formatMoney(item.amount)}
                    </Text>
                    <Text
                      style={{
                        color: C.muted,
                        width: 34,
                        textAlign: "right",
                        fontSize: 10,
                      }}
                    >
                      {totals.expense > 0
                        ? Math.round((item.amount / totals.expense) * 100)
                        : 0}
                      %
                    </Text>
                  </View>
                  {budget > 0 ? (
                    <BudgetProgress
                      spent={item.amount}
                      planned={budget}
                      color={item.color}
                      height={5}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
            Cuando registres un gasto, desglosaremos aquí a dónde va tu dinero.
          </Text>
        )}
      </Card>
      <Card style={{ borderColor: "#2B5E5B" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 7,
          }}
        >
          <IconBadge name="lock-closed-outline" color={C.mint} size={37} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: "700" }}>
              Datos y privacidad
            </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>
              Solo en este navegador o dispositivo
            </Text>
          </View>
        </View>
        <Text
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 18,
            marginBottom: 13,
          }}
        >
          Tus movimientos y presupuestos se guardan localmente. No creamos una
          cuenta ni enviamos tus datos financieros a un servidor. Si borras los
          datos del navegador o dispositivo, podrías perderlos: conserva un CSV
          como respaldo.
        </Text>
        <View style={{ flexDirection: "row", gap: 9 }}>
          <View style={{ flex: 1 }}>
            <ActionButton
              title="Importar CSV"
              icon="cloud-download-outline"
              secondary
              onPress={importCSV}
              small
            />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              title="Exportar CSV"
              icon="download-outline"
              onPress={exportCSV}
              small
              disabled={busy}
            />
          </View>
        </View>
        <Text
          style={{
            color: C.faint,
            fontSize: 10,
            lineHeight: 15,
            marginTop: 10,
          }}
        >
          El CSV usa columnas fecha, tipo, importe, categoría y nota. Importar
          agrega los movimientos válidos sin reemplazar los que ya guardaste.
        </Text>
      </Card>
      {transactions.length ? (
        <Card style={{ borderColor: C.border }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "700" }}>
            Administrar tus datos locales
          </Text>
          <Text
            style={{
              color: C.muted,
              fontSize: 11,
              lineHeight: 16,
              marginTop: 5,
              marginBottom: 12,
            }}
          >
            {transactions.length} movimientos guardados en este dispositivo.
          </Text>
          <Pressable
            onPress={clearData}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              flexDirection: "row",
              gap: 7,
              alignItems: "center",
              borderColor: "#674141",
              borderWidth: 1,
              borderRadius: 11,
              paddingHorizontal: 12,
              paddingVertical: 9,
              backgroundColor: pressed ? "#2B2027" : "#211C27",
            })}
          >
            <Ionicons name="trash-outline" size={14} color={C.coral} />
            <Text style={{ color: C.coral, fontSize: 11, fontWeight: "600" }}>
              Borrar todos los datos de este dispositivo
            </Text>
          </Pressable>
        </Card>
      ) : null}
      <Text
        style={{
          color: C.faint,
          fontSize: 10,
          textAlign: "center",
          lineHeight: 15,
        }}
      >
        Pocketwise · privacidad por diseño · funciona sin conexión
      </Text>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
      />
      <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}
