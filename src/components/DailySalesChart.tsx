import { formatRs } from "@/lib/format";

interface DayStat {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
}

export function DailySalesChart({ data }: { data: DayStat[] }) {
  const maxSales = Math.max(...data.map((d) => d.sales), 1);

  return (
    <div className="space-y-5">
      {data.map((day) => (
        <div key={day.date} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{day.date}</span>
              <span className="ml-2 text-muted-foreground">
                {day.transactions} sale{day.transactions !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{formatRs(day.sales)}</span>
              <span className="ml-2 text-success text-xs">+{formatRs(day.profit)}</span>
            </div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${Math.max((day.sales / maxSales) * 100, day.sales > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
