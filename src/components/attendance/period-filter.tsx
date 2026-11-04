import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selectClassName } from "@/lib/styles";

/** Form filter periode (GET) untuk laporan dan halaman orang tua. */
export function PeriodFilter({
  from,
  to,
  select,
  hidden,
}: {
  from: string;
  to: string;
  select?: { name: string; label: string; value: string; options: { value: string; label: string }[] };
  hidden?: Record<string, string>;
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {select && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          {select.label}
          <select name={select.name} defaultValue={select.value} className={`${selectClassName} min-w-40`}>
            {select.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Dari tanggal
        <Input type="date" name="dari" defaultValue={from} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Sampai tanggal
        <Input type="date" name="sampai" defaultValue={to} />
      </label>
      <button type="submit" className={buttonVariants({ variant: "outline" })}>
        Tampilkan
      </button>
    </form>
  );
}
