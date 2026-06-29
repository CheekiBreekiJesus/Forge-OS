export type KpiTrend = "up" | "down" | "neutral";
import { cn } from "../lib/cn";
import { Card, CardContent } from "./card";

export function KpiCard({
  title,
  value,
  changeText,
  trend,
  variant = "default",
  sparkline,
}: {
  title: string;
  value: string;
  changeText: string;
  trend: KpiTrend;
  variant?: "default" | "danger";
  sparkline: number[];
}) {
  const max = Math.max(...sparkline);
  const min = Math.min(...sparkline);
  const range = max - min || 1;

  const trendColor =
    variant === "danger"
      ? "text-forge-danger"
      : trend === "up"
        ? "text-forge-success"
        : trend === "down"
          ? "text-forge-success"
          : "text-forge-muted";

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        <p className="text-xs font-medium text-forge-muted">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-forge-foreground">{value}</p>
        <p className={cn("text-xs font-medium", trendColor)}>{changeText}</p>
        <svg
          className="mt-auto h-10 w-full"
          viewBox={`0 0 ${sparkline.length * 12} 40`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={variant === "danger" ? "text-forge-danger/60" : "text-forge-info/70"}
            points={sparkline
              .map((v, i) => {
                const x = i * 12 + 6;
                const y = 36 - ((v - min) / range) * 32;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>
      </CardContent>
    </Card>
  );
}
