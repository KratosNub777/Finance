import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatMonth, shiftMonth } from "@/lib/finance";
import { useFinance } from "@/lib/AppContext";

export const C = {
  bg: "#0B1222",
  surface: "#131E32",
  raised: "#18263C",
  border: "#25344D",
  text: "#EFF5FF",
  muted: "#96A7BF",
  faint: "#687A94",
  mint: "#6FE7C2",
  amber: "#F5BE67",
  coral: "#F28B82",
  blue: "#7CC8EF",
};

// Desde este ancho la navegación pasa a una barra lateral y el contenido se centra con ancho máximo.
export const DESKTOP_MIN = 900;
export const SIDEBAR_WIDTH = 220;
export const CONTENT_MAX = 1100;

export function useDesktop() {
  return useWindowDimensions().width >= DESKTOP_MIN;
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const desktop = useDesktop();
  if (!scroll)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: C.bg, paddingHorizontal: 18 }}
        edges={["top", "left", "right"]}
      >
        {children}
      </SafeAreaView>
    );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: desktop ? 32 : 18,
          paddingTop: desktop ? 28 : 12,
          paddingBottom: desktop ? 48 : 30,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            {
              width: "100%",
              maxWidth: CONTENT_MAX,
              alignSelf: "center",
              gap: desktop ? 20 : 16,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  padding = 16,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderColor: C.border,
          borderWidth: 1,
          borderRadius: 20,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TextLabel({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: object;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ color: C.text, fontSize: 15, fontWeight: "600" }, style]}
    >
      {children}
    </Text>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: C.muted,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}

export function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 2,
      }}
    >
      <View style={{ flex: 1, gap: 5 }}>
        <Text
          style={{
            color: C.text,
            fontSize: 25,
            fontWeight: "700",
            letterSpacing: -0.6,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: C.muted, fontSize: 13, lineHeight: 19 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function SectionTitle({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: C.text, fontSize: 17, fontWeight: "600" }}>
          {title}
        </Text>
        {note ? (
          <Text style={{ color: C.muted, fontSize: 12 }}>{note}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  icon,
  secondary = false,
  small = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  secondary?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        minHeight: small ? 36 : 46,
        paddingHorizontal: small ? 11 : 15,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: secondary ? C.border : C.mint,
        backgroundColor: secondary ? C.raised : C.mint,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
      })}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={small ? 15 : 18}
          color={secondary ? C.text : C.bg}
        />
      ) : null}
      <Text
        style={{
          color: secondary ? C.text : C.bg,
          fontSize: small ? 12 : 14,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function IconBadge({
  name,
  color = C.mint,
  size = 38,
  background,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color?: string;
  size?: number;
  background?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: background ?? `${color}20`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={name} size={size * 0.49} color={color} />
    </View>
  );
}

export function MonthControl({
  month,
  setMonth,
}: {
  month: string;
  setMonth: (month: string) => void;
}) {
  const current = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const maxMonth = shiftMonth(current, 12);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 13,
        paddingHorizontal: 5,
        height: 42,
      }}
    >
      <Pressable
        accessibilityLabel="Mes anterior"
        onPress={() => setMonth(shiftMonth(month, -1))}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="chevron-back" color={C.muted} size={18} />
      </Pressable>
      <Text
        style={{
          minWidth: 94,
          textAlign: "center",
          color: C.text,
          fontSize: 12,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {formatMonth(month)}
      </Text>
      <Pressable
        accessibilityLabel="Mes siguiente"
        onPress={() => setMonth(shiftMonth(month, 1))}
        disabled={month >= maxMonth}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          opacity: month >= maxMonth ? 0.3 : 1,
        }}
      >
        <Ionicons name="chevron-forward" color={C.muted} size={18} />
      </Pressable>
    </View>
  );
}

export function MonthBar({ right }: { right?: React.ReactNode }) {
  const { month, setMonth } = useFinance();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <MonthControl month={month} setMonth={setMonth} />
      {right}
    </View>
  );
}

export function LoadingState() {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 300,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: C.bg,
      }}
    >
      <ActivityIndicator color={C.mint} size="large" />
      <Text style={{ color: C.muted, marginTop: 12 }}>
        Preparando tu espacio…
      </Text>
    </View>
  );
}
