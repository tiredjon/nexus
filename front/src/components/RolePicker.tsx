import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Radar, Building2, MapPin, Users, Briefcase, ShieldCheck } from "lucide-react";
import { MAHALLAS, type Mahalla } from "@/lib/data";
import { ROLE_CONFIG, MAIN_ROLES, type Role } from "@/lib/permissions";
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

const ROLE_ICONS: Record<(typeof MAIN_ROLES)[number], React.ReactNode> = {
  mahalla_officer: <MapPin className="size-5" />,
  youth_rep: <Users className="size-5" />,
  district_officer: <Building2 className="size-5" />,
  employment_specialist: <Briefcase className="size-5" />,
};

const ROLE_SHORT_LABELS: Record<(typeof MAIN_ROLES)[number], string> = {
  mahalla_officer: "Сотрудник махалли",
  youth_rep: "Представитель по молодёжи",
  district_officer: "Сотрудник хокимията района",
  employment_specialist: "Специалист по занятости",
};

export function RolePicker() {
  const { signIn } = useStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("district_officer");
  const [mahalla, setMahalla] = useState<Mahalla>(MAHALLAS[0]);

  const config = ROLE_CONFIG[role];

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
        <div className="mt-3 grid gap-2">
          {MAIN_ROLES.map((r) => (
            <RoleCard
              key={r}
              active={role === r}
              onClick={() => setRole(r)}
              icon={ROLE_ICONS[r]}
              title={ROLE_SHORT_LABELS[r]}
            />
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">{config.description}</p>

        <div className="mt-5 border-t border-border pt-5">
          <p className="text-center text-xs text-muted-foreground">Технический доступ</p>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={cn(
              "mt-2 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left",
              role === "admin"
                ? "border-muted-foreground/40 bg-muted/50"
                : "border-border bg-muted/20 text-muted-foreground",
            )}
          >
            <ShieldCheck className="size-5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">
              {ROLE_CONFIG.admin.shortLabel}
            </span>
          </button>
        </div>

        {config.needsMahallaSelect && (
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
          onClick={() => {
            signIn({
              role,
              mahalla: config.needsMahallaSelect ? mahalla : null,
            });
            navigate({ to: config.landing });
          }}
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
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors duration-150",
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60",
      )}
    >
      <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </button>
  );
}
