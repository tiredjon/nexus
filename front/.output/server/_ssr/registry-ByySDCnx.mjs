import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as CheckboxIndicator, p as require_jsx_runtime, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { D as ArrowUpDown, S as Check, o as Search } from "../_libs/lucide-react.mjs";
import { a as SelectContent, c as SelectValue, d as MAHALLAS, h as cn, i as Select, m as STATUSES, o as SelectItem, r as Route$2, s as SelectTrigger, u as useStore, v as isStale } from "./router-B2dalpiV.mjs";
import { a as StatusBadge, i as PageHeader, n as FreshnessDot, r as NeetBadge, t as EmptyState } from "./common-D0v8eWAw.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registry-ByySDCnx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
function Registry() {
	const { scopedPeople, session } = useStore();
	const navigate = useNavigate();
	const search = Route$2.useSearch();
	const locked = session?.role === "mahalla";
	const [q, setQ] = (0, import_react.useState)("");
	const [mahalla, setMahalla] = (0, import_react.useState)(search.mahalla ?? "all");
	const [status, setStatus] = (0, import_react.useState)("all");
	const [ages, setAges] = (0, import_react.useState)([18, 30]);
	const [onlyNeet, setOnlyNeet] = (0, import_react.useState)(false);
	const [onlySupport, setOnlySupport] = (0, import_react.useState)(false);
	const [onlyStale, setOnlyStale] = (0, import_react.useState)(false);
	const [sort, setSort] = (0, import_react.useState)({
		key: "fullName",
		dir: 1
	});
	const rows = (0, import_react.useMemo)(() => {
		const [minA, maxA] = [ages[0] ?? 18, ages[1] ?? 30];
		return scopedPeople.filter((p) => p.fullName.toLowerCase().includes(q.trim().toLowerCase())).filter((p) => locked || mahalla === "all" ? true : p.mahalla === mahalla).filter((p) => status === "all" ? true : p.status === status).filter((p) => p.age >= minA && p.age <= maxA).filter((p) => onlyNeet ? p.neet : true).filter((p) => onlySupport ? p.needsSupport : true).filter((p) => onlyStale ? isStale(p) : true).sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), "ru") * sort.dir);
	}, [
		scopedPeople,
		q,
		mahalla,
		status,
		ages,
		onlyNeet,
		onlySupport,
		onlyStale,
		sort,
		locked
	]);
	const th = (key, label) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: "px-4 py-3 text-left font-medium",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			className: "inline-flex items-center gap-1 hover:text-foreground",
			onClick: () => setSort((s) => ({
				key,
				dir: s.key === key && s.dir === 1 ? -1 : 1
			})),
			children: [
				label,
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "size-3" })
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Реестр молодёжи",
			subtitle: `Найдено записей: ${rows.length}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-border bg-card p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Поиск по ФИО",
							value: q,
							onChange: (e) => setQ(e.target.value),
							className: "pl-9"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: locked ? session.mahalla : mahalla,
						onValueChange: setMahalla,
						disabled: locked,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Махалля" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "Все махалли"
						}), MAHALLAS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: m,
							children: m
						}, m))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: status,
						onValueChange: setStatus,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Статус" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "all",
							children: "Все статусы"
						}), STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: s,
							children: s
						}, s))] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-1 text-xs text-muted-foreground",
							children: [
								"Возраст: ",
								ages[0],
								"–",
								ages[1],
								" лет"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							min: 18,
							max: 30,
							step: 1,
							value: ages,
							onValueChange: setAges
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-5 border-t border-border pt-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "только NEET",
						checked: onlyNeet,
						onChange: setOnlyNeet
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "нужна поддержка",
						checked: onlySupport,
						onChange: setOnlySupport
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "устаревшие данные",
						checked: onlyStale,
						onChange: setOnlyStale
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 overflow-hidden rounded-xl border border-border bg-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-border bg-muted/40 text-xs text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								th("fullName", "ФИО"),
								th("age", "Возраст"),
								th("mahalla", "Махалля"),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-left font-medium",
									children: "Статус"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-4 py-3 text-left font-medium",
									children: "Деятельность"
								}),
								th("lastUpdate", "Актуальность")
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.slice(0, 150).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => navigate({
								to: "/person/$id",
								params: { id: p.id }
							}),
							className: "cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: p.fullName
										}), p.neet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeetBadge, {})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-muted-foreground",
									children: p.age
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-muted-foreground",
									children: p.mahalla
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-muted-foreground",
									children: p.activity
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FreshnessDot, { person: p })
								})
							]
						}, p.id)) })]
					})
				}),
				rows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { text: "По заданным фильтрам записи не найдены." }),
				rows.length > 150 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border p-3 text-center text-xs text-muted-foreground",
					children: [
						"Показаны первые 150 записей из ",
						rows.length,
						". Уточните фильтры."
					]
				})
			]
		})
	] });
}
function Toggle({ label, checked, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex cursor-pointer items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
			checked,
			onCheckedChange: (v) => onChange(Boolean(v))
		}), label]
	});
}
//#endregion
export { Registry as component };
