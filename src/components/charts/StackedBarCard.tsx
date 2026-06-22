import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "./ChartCard";

interface DualMetric {
  name: string;
  metric1: number; // e.g. Agreed Capacity Hours
  metric2: number; // e.g. Active Tasks Count
}

interface StackedBarCardProps {
  title: string;
  description?: string;
  data: DualMetric[];
  label1: string;
  label2: string;
  color1?: string;
  color2?: string;
  isLoading?: boolean;
}

export default function StackedBarCard({
  title,
  description,
  data,
  label1,
  label2,
  color1 = "#111111", // deep dark charcoal
  color2 = "#C9F24D", // energetic vibrant lime
  isLoading = false,
}: StackedBarCardProps) {
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
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "10px",
              fontFamily: "Vazirmatn, sans-serif",
              direction: "rtl",
              paddingTop: "6px",
            }}
          />
          <Bar name={label1} dataKey="metric1" fill={color1} radius={[6, 6, 0, 0]} maxBarSize={16} />
          <Bar name={label2} dataKey="metric2" fill={color2} radius={[6, 6, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
