import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";

interface LineChartCardProps {
  title: string;
  description?: string;
  data: { name: string; value: number }[];
  isLoading?: boolean;
  lineColor?: string;
}

export default function LineChartCard({
  title,
  description,
  data,
  isLoading = false,
  lineColor = "#111111", // Default elegant charcoal line
}: LineChartCardProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartCard title={title} description={description} isLoading={isLoading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 1, fill: "#FFFFFF" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
