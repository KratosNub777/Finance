import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Transaction } from "@/lib/finance";
import {
  currentMonthKey,
  expenseCategories,
  incomeCategories,
  isValidISODate,
} from "@/lib/finance";
import { C, ActionButton } from "@/components/ui";
import type { TransactionDraft } from "@/lib/AppContext";

export function TransactionFormModal({
  visible,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial?: Transaction | null;
  onClose: () => void;
  onSave: (draft: TransactionDraft) => void;
}) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState(
    `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, "0")}`,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setKind(initial?.kind ?? "expense");
    setAmount(initial ? String(initial.amount) : "");
    setCategory(initial?.category ?? expenseCategories[0]);
    setDate(
      initial?.date ??
        `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, "0")}`,
    );
    setNote(initial?.note ?? "");
    setError("");
  }, [initial, visible]);

  const categories = kind === "expense" ? expenseCategories : incomeCategories;
  const save = () => {
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Escribe un importe mayor que cero.");
      return;
    }
    if (!isValidISODate(date)) {
      setError("Usa una fecha válida con formato AAAA-MM-DD.");
      return;
    }
    onSave({
      kind,
      amount: Math.round(parsed * 100) / 100,
      category,
      date,
      note: note.trim() || undefined,
    });
    onClose();
  };
  const inputStyle = {
    height: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingHorizontal: 13,
    color: C.text,
    fontSize: 15,
  } as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "#050A14CC",
        }}
      >
        <View
          style={{
            maxHeight: "92%",
            backgroundColor: C.surface,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            borderColor: C.border,
            borderWidth: 1,
            paddingTop: 10,
            paddingBottom: Platform.OS === "web" ? 24 : 34,
          }}
        >
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 3,
              backgroundColor: C.faint,
              alignSelf: "center",
              marginBottom: 14,
            }}
          />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 8,
              gap: 15,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    color: C.muted,
                    fontSize: 10,
                    letterSpacing: 1.3,
                    fontWeight: "700",
                  }}
                >
                  {initial ? "ACTUALIZAR REGISTRO" : "TU DINERO, AL DÍA"}
                </Text>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 23,
                    fontWeight: "700",
                    marginTop: 4,
                  }}
                >
                  {initial ? "Editar movimiento" : "Nuevo movimiento"}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Cerrar formulario"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: C.raised,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" color={C.muted} size={19} />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: "row",
                padding: 4,
                backgroundColor: C.bg,
                borderRadius: 14,
                gap: 5,
              }}
            >
              {(["expense", "income"] as const).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => {
                    setKind(value);
                    setCategory(
                      value === "expense"
                        ? expenseCategories[0]
                        : incomeCategories[0],
                    );
                  }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 11,
                    borderRadius: 11,
                    backgroundColor:
                      kind === value
                        ? value === "expense"
                          ? "#382729"
                          : "#173A35"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color:
                        kind === value
                          ? value === "expense"
                            ? C.coral
                            : C.mint
                          : C.muted,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {value === "expense" ? "Gasto" : "Ingreso"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                Importe · USD
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={C.faint}
                keyboardType="decimal-pad"
                style={[
                  inputStyle,
                  { fontSize: 23, fontWeight: "700", height: 58 },
                ]}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                Categoría
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categories.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setCategory(value)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor:
                        category === value ? `${C.mint}20` : C.bg,
                      borderWidth: 1,
                      borderColor: category === value ? C.mint : C.border,
                    }}
                  >
                    <Text
                      style={{
                        color: category === value ? C.mint : C.muted,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                Fecha
              </Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={C.faint}
                style={inputStyle}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
                Nota{" "}
                <Text style={{ color: C.faint, fontWeight: "400" }}>
                  (opcional)
                </Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="¿En qué consistió?"
                placeholderTextColor={C.faint}
                style={inputStyle}
                maxLength={100}
              />
            </View>
            {error ? (
              <Text
                accessibilityRole="alert"
                style={{ color: C.coral, fontSize: 12 }}
              >
                {error}
              </Text>
            ) : null}
            <ActionButton
              title={initial ? "Guardar cambios" : "Guardar movimiento"}
              onPress={save}
              icon="checkmark"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
