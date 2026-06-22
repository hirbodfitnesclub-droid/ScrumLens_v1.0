import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";

interface DonutChartCardProps {
  title: string;
  description?: string;
  data: { name: string; value: number; color?: string }[];
  isLoading?: boolean;
}

export default function DonutChartCard({
  title,
  description,
  data,
  isLoading = false,
}: DonutChartCardProps) {
  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);

  // Fallback palette if specific colors aren't passed
  const FALLBACK_PALETTE = ["#111111", "#C9F24D", "#3B82F6", "#F59E0B", "#10B981"];

  return (
    <ChartCard title={title} description={description} isLoading={isLoading} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data.filter((item) => item.value > 0)}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]}
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={2}
              />
            ))}
          </Pie>
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
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: "10px",
              fontFamily: "Vazirmatn, sans-serif",
              direction: "rtl",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
