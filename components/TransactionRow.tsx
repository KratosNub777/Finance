import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Transaction } from "@/lib/finance";
import { categoryColors, formatDate, formatMoney } from "@/lib/finance";
import { C, IconBadge } from "@/components/ui";

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Vivienda: "home-outline",
  "Comer fuera": "restaurant-outline",
  Supermercado: "cart-outline",
  Servicios: "flash-outline",
  Transporte: "car-outline",
  Salud: "heart-outline",
  Entretenimiento: "film-outline",
  Compras: "bag-outline",
  Otros: "ellipsis-horizontal-outline",
  Salario: "briefcase-outline",
  "Trabajo independiente": "laptop-outline",
  Inversiones: "trending-up-outline",
  "Otros ingresos": "add-circle-outline",
};

export function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const income = transaction.kind === "income";
  const color = categoryColors[transaction.category] ?? C.muted;
  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        gap: 11,
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <IconBadge
        name={categoryIcons[transaction.category] ?? "ellipse-outline"}
        color={color}
        size={39}
      />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ color: C.text, fontSize: 13, fontWeight: "600" }}
        >
          {transaction.note || transaction.category}
        </Text>
        <Text numberOfLines={1} style={{ color: C.muted, fontSize: 11 }}>
          {transaction.category} · {formatDate(transaction.date, true)}
        </Text>
      </View>
      <Text
        style={{
          color: income ? C.mint : C.text,
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        {income ? "+" : "−"}
        {formatMoney(transaction.amount, 2)}
      </Text>
      {onDelete ? (
        <Pressable
          accessibilityLabel="Eliminar movimiento"
          onPress={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
          style={{ paddingLeft: 3, paddingVertical: 6 }}
        >
          <Ionicons name="trash-outline" size={16} color={C.faint} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
