import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { expenseCategories } from "@/lib/finance";
import { C, ActionButton } from "@/components/ui";

export function BudgetEditorModal({
  visible,
  monthLabel,
  initialCategory,
  initialAmount,
  onClose,
  onSave,
}: {
  visible: boolean;
  monthLabel: string;
  initialCategory?: string;
  initialAmount?: number;
  onClose: () => void;
  onSave: (category: string, amount: number) => void;
}) {
  const [category, setCategory] = useState(expenseCategories[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!visible) return;
    setCategory(initialCategory ?? expenseCategories[0]);
    setAmount(initialAmount !== undefined ? String(initialAmount) : "");
    setError("");
  }, [visible, initialCategory, initialAmount]);
  const save = () => {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      setError("El presupuesto debe ser mayor que cero.");
      return;
    }
    onSave(category, Math.round(value * 100) / 100);
    onClose();
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            backgroundColor: C.surface,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            borderColor: C.border,
            borderWidth: 1,
            paddingHorizontal: 20,
            paddingTop: 22,
            paddingBottom: 34,
            gap: 16,
          }}
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
                  fontWeight: "700",
                  letterSpacing: 1.2,
                }}
              >
                PLAN MENSUAL · {monthLabel.toLocaleUpperCase("es-MX")}
              </Text>
              <Text
                style={{
                  color: C.text,
                  fontSize: 23,
                  fontWeight: "700",
                  marginTop: 5,
                }}
              >
                Presupuesto por categoría
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                backgroundColor: C.raised,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" color={C.muted} size={18} />
            </Pressable>
          </View>
          <View style={{ gap: 9 }}>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
              Categoría de gasto
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {expenseCategories.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setCategory(value)}
                  style={{
                    borderRadius: 11,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    backgroundColor: category === value ? `${C.mint}20` : C.bg,
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
            </ScrollView>
          </View>
          <View style={{ gap: 8 }}>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: "600" }}>
              Importe planeado · USD
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={C.faint}
              keyboardType="decimal-pad"
              style={{
                height: 52,
                borderRadius: 13,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.bg,
                paddingHorizontal: 14,
                color: C.text,
                fontSize: 21,
                fontWeight: "700",
              }}
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
            title="Guardar presupuesto"
            onPress={save}
            icon="checkmark"
          />
        </View>
      </View>
    </Modal>
  );
}
