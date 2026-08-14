import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { T as Briefcase, _ as Clock, i as TriangleAlert, n as Users, r as UserX, v as CircleQuestionMark } from "../_libs/lucide-react.mjs";
import { d as MAHALLAS, g as daysAgo, u as useStore, v as isStale, y as neetMonthlyTrend } from "./router-B2dalpiV.mjs";
import { i as PageHeader, r as NeetBadge, t as EmptyState } from "./common-D0v8eWAw.mjs";
import { a as XAxis, c as Bar, d as ResponsiveContainer, f as Tooltip, i as YAxis, l as Pie, n as BarChart, o as Line, p as Legend, r as LineChart, s as CartesianGrid, t as PieChart, u as Cell } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dm6gFwr8.js
var import_jsx_runtime = require_jsx_runtime();
var COLORS = [
	"#1d4ed8",
	"#059669",
	"#d97706",
	"#dc2626",
	"#64748b",
	"#7c3aed",
	"#0891b2"
];
function Dashboard() {
	const { scopedPeople, session } = useStore();
	const total = scopedPeople.length;
	const employed = scopedPeople.filter((p) => p.status === "Работает" || p.status === "Предприниматель").length;
	const unemployed = scopedPeople.filter((p) => p.status === "Безработный").length;
	const neet = scopedPeople.filter((p) => p.neet).length;
	const unknown = scopedPeople.filter((p) => p.status === "Статус не уточнён").length;
	const stale = scopedPeople.filter(isStale).length;
	const statusData = Array.from(scopedPeople.reduce((m, p) => m.set(p.status, (m.get(p.status) ?? 0) + 1), /* @__PURE__ */ new Map())).map(([name, value]) => ({
		name,
		value
	}));
	const byMahalla = (session?.role === "mahalla" && session.mahalla ? [session.mahalla] : [...MAHALLAS]).map((m) => {
		const list = scopedPeople.filter((p) => p.mahalla === m);
		return {
			mahalla: m,
			Занятые: list.filter((p) => p.status === "Работает" || p.status === "Предприниматель").length,
			Учатся: list.filter((p) => p.status === "Учится").length,
			NEET: list.filter((p) => p.neet).length,
			Другое: list.filter((p) => p.status === "Другая деятельность" || p.status === "Направлен на программу").length
		};
	});
	const trend = neetMonthlyTrend(scopedPeople);
	const attention = scopedPeople.filter((p) => p.neet && p.neetReviewStatus === "Ожидает проверки").sort((a, b) => daysAgo(b.lastUpdate) - daysAgo(a.lastUpdate)).slice(0, 5);
	const pct = (n) => total ? Math.round(n / total * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Дашборд",
			subtitle: session?.role === "mahalla" ? `Махалля ${session.mahalla}` : "Сводные показатели по 12 махаллям района"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: Users,
					label: "Всего молодёжи",
					value: total,
					tone: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: Briefcase,
					label: "Занятые",
					value: employed,
					hint: `${pct(employed)}% от общего числа`,
					tone: "success"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: UserX,
					label: "Безработные",
					value: unemployed,
					hint: `${pct(unemployed)}%`,
					tone: "danger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: TriangleAlert,
					label: "NEET (требуют внимания)",
					value: neet,
					hint: `${pct(neet)}%`,
					tone: "danger"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: CircleQuestionMark,
					label: "Статус не уточнён",
					value: unknown,
					tone: "warning"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					icon: Clock,
					label: "Данные устарели (>90 дней)",
					value: stale,
					tone: "warning"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Распределение по статусам",
				className: "lg:col-span-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 280,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
							data: statusData,
							dataKey: "value",
							nameKey: "name",
							innerRadius: 60,
							outerRadius: 95,
							paddingAngle: 2,
							children: statusData.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: COLORS[i % COLORS.length] }, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } })
					] })
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Структура занятости по махаллям",
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: Math.max(280, byMahalla.length * 26),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: byMahalla,
						layout: "vertical",
						margin: { left: 40 },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								horizontal: false,
								stroke: "#e2e8f0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								type: "number",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								dataKey: "mahalla",
								type: "category",
								width: 110,
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Занятые",
								stackId: "a",
								fill: "#059669"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Учатся",
								stackId: "a",
								fill: "#1d4ed8"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Другое",
								stackId: "a",
								fill: "#94a3b8"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "NEET",
								stackId: "a",
								fill: "#dc2626"
							})
						]
					})
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Динамика NEET за 6 месяцев",
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 260,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: trend,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								stroke: "#e2e8f0"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "month",
								tick: { fontSize: 11 }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "neet",
								name: "NEET",
								stroke: "#dc2626",
								strokeWidth: 2.5,
								dot: true
							})
						]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "Требуют внимания",
				children: attention.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { text: "Нет ожидающих проверки случаев NEET." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: attention.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/person/$id",
						params: { id: p.id },
						className: "flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted/60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-medium",
								children: p.fullName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block text-xs text-muted-foreground",
								children: [
									p.mahalla,
									" · ",
									p.age,
									" лет · ожидает ",
									daysAgo(p.lastUpdate),
									" дн."
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeetBadge, {})]
					}) }, p.id))
				})
			})]
		})
	] });
}
var TONES = {
	primary: "bg-primary/10 text-primary",
	success: "bg-success/10 text-success",
	danger: "bg-danger/10 text-danger",
	warning: "bg-warning/15 text-warning"
};
function Kpi({ icon: Icon, label, value, hint, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-muted-foreground",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 text-3xl font-semibold tracking-tight",
					children: value
				}),
				hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: hint
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `flex size-9 items-center justify-center rounded-lg ${TONES[tone]}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
			})]
		})
	});
}
function Card({ title, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `rounded-xl border border-border bg-card p-5 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-4 text-sm font-semibold",
			children: title
		}), children]
	});
}
//#endregion
export { Dashboard as component };
