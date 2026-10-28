import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { C, SIDEBAR_WIDTH, useDesktop } from "@/components/ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const desktop = useDesktop();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: C.mint,
        tabBarInactiveTintColor: C.faint,
        ...(desktop
          ? {
              // Barra lateral izquierda para pantallas anchas.
              tabBarPosition: "left" as const,
              tabBarLabelPosition: "beside-icon" as const,
              tabBarActiveBackgroundColor: "#6FE7C214",
              tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
              tabBarItemStyle: {
                height: 44,
                borderRadius: 12,
                paddingHorizontal: 14,
                marginBottom: 4,
                justifyContent: "flex-start" as const,
              },
              tabBarStyle: {
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                paddingTop: 24,
                paddingHorizontal: 12,
                backgroundColor: C.bg,
                borderRightColor: C.border,
                borderRightWidth: 1,
                elevation: 0,
              },
            }
          : {
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: "600",
                marginTop: 1,
              },
              tabBarItemStyle: { paddingTop: 6 },
              tabBarStyle: {
                height: 58 + bottomPadding,
                paddingBottom: bottomPadding,
                paddingTop: 3,
                backgroundColor: C.bg,
                borderTopColor: C.border,
                borderTopWidth: 1,
                elevation: 0,
              },
            }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Ionicons size={21} name="home-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ color }) => (
            <Ionicons size={21} name="swap-horizontal-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Presupuesto",
          tabBarIcon: ({ color }) => (
            <Ionicons size={21} name="pie-chart-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Análisis",
          tabBarIcon: ({ color }) => (
            <Ionicons size={21} name="sparkles-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
