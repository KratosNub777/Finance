import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { formatMoney, type TrendMonth } from "@/lib/finance";
import { C } from "@/components/ui";

export function TrendChart({ data }: { data: TrendMonth[] }) {
  const width = 320;
  const height = 176;
  const left = 8;
  const right = 10;
  const top = 14;
  const bottom = 27;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue =
    Math.max(1, ...data.flatMap((item) => [item.income, item.expense])) * 1.12;
  const x = (index: number) =>
    left + index * (plotWidth / Math.max(1, data.length - 1));
  const y = (amount: number) =>
    top + plotHeight - (amount / maxValue) * plotHeight;
  const pathFor = (selector: (item: TrendMonth) => number) =>
    data
      .map(
        (item, index) =>
          `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(selector(item)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <View style={{ width: "100%" }}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {[0, 1, 2].map((index) => (
          <Line
            key={index}
            x1={left}
            x2={width - right}
            y1={top + (plotHeight * index) / 2}
            y2={top + (plotHeight * index) / 2}
            stroke={C.border}
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        {data.length > 0 ? (
          <>
            <Path
              d={pathFor((item) => item.income)}
              fill="none"
              stroke={C.mint}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d={pathFor((item) => item.expense)}
              fill="none"
              stroke="#9A8BF3"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((item, index) => (
              <Circle
                key={`in-${item.key}`}
                cx={x(index)}
                cy={y(item.income)}
                r="3.2"
                fill={C.mint}
              />
            ))}
            {data.map((item, index) => (
              <Circle
                key={`out-${item.key}`}
                cx={x(index)}
                cy={y(item.expense)}
                r="3.2"
                fill="#9A8BF3"
              />
            ))}
          </>
        ) : null}
      </Svg>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: -3,
          paddingHorizontal: 1,
        }}
      >
        {data.map((item) => (
          <Text
            key={item.key}
            style={{
              color: C.faint,
              fontSize: 10,
              textTransform: "capitalize",
            }}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function DonutChart({
  segments,
  total,
  size = 148,
}: {
  segments: { amount: number; color: string }[];
  total: number;
  size?: number;
}) {
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={C.raised}
          strokeWidth={stroke}
        />
        {segments
          .filter((segment) => total > 0 && segment.amount > 0)
          .map((segment, index) => {
            const length = Math.max(
              0,
              (segment.amount / total) * circumference - 3,
            );
            const offset = -consumed;
            consumed += (segment.amount / total) * circumference;
            return (
              <Circle
                key={`${segment.color}-${index}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", gap: 3 }}>
        <Text
          style={{
            color: C.muted,
            fontSize: 8,
            fontWeight: "700",
            letterSpacing: 1.2,
          }}
        >
          GASTADO
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            maxWidth: size - 40,
            color: C.text,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {formatMoney(total)}
        </Text>
      </View>
    </View>
  );
}

export function BudgetProgress({
  spent,
  planned,
  color = C.mint,
  height = 8,
}: {
  spent: number;
  planned: number;
  color?: string;
  height?: number;
}) {
  const progress =
    planned > 0 ? Math.min(spent / planned, 1) : spent > 0 ? 1 : 0;
  const fill = spent > planned && planned > 0 ? C.coral : color;
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: C.raised,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.round(progress * 100)}%`,
          height: "100%",
          backgroundColor: fill,
          borderRadius: height,
        }}
      />
    </View>
  );
}
