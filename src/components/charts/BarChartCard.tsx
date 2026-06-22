import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";

interface BarChartCardProps {
  title: string;
  description?: string;
  data: { name: string; value: number }[];
  isLoading?: boolean;
  barColor?: string;
}

export default function BarChartCard({
  title,
  description,
  data,
  isLoading = false,
  barColor = "#111111", // default elegant charcoal
}: BarChartCardProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard title={title} description={description} isLoading={isLoading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E6E0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#8E9185" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8E9185" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(17,17,17,0.03)" }}
            contentStyle={{
              background: "#111111",
              border: "none",
              borderRadius: "14px",
              color: "#FFFFFF",
              fontSize: "11px",
              fontFamily: "Vazirmatn, sans-serif",
              textAlign: "right",
              direction: "rtl",
            }}
            labelStyle={{ fontWeight: "bold" }}
          />
          <Bar dataKey="value" fill={barColor} radius={[8, 8, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
