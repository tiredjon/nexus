import { useState } from "react";
import { Radar, Building2, MapPinned } from "lucide-react";
import { MAHALLAS, type Mahalla } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/lib/utils";

export function RolePicker() {
  const { signIn } = useStore();
  const [role, setRole] = useState<"mahalla" | "district">("district");
  const [mahalla, setMahalla] = useState<Mahalla>(MAHALLAS[0]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary">
            <Radar className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Yoshlar Radar</h1>
            <p className="text-sm text-muted-foreground">
              Мониторинг занятости молодёжи · Мирзо-Улугбекский район
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm font-medium">Выберите роль для входа</p>
        <div className="mt-3 grid gap-3">
          <RoleCard
            active={role === "mahalla"}
            onClick={() => setRole("mahalla")}
            icon={<MapPinned className="size-5" />}
            title="Инспектор махалли"
            desc="Доступ только к данным своей махалли"
          />
          <RoleCard
            active={role === "district"}
            onClick={() => setRole("district")}
            icon={<Building2 className="size-5" />}
            title="Сотрудник хокимията района"
            desc="Доступ ко всем 12 махаллям района"
          />
        </div>

        {role === "mahalla" && (
          <div className="mt-4">
            <label className="text-sm font-medium">Махалля</label>
            <Select value={mahalla} onValueChange={(v) => setMahalla(v as Mahalla)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAHALLAS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => signIn({ role, mahalla: role === "mahalla" ? mahalla : null })}
        >
          Войти в систему
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Демонстрационный прототип. Все данные синтетические, реальные персональные данные не
          используются.
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60",
      )}
    >
      <span className={cn("mt-0.5", active ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
