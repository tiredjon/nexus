import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { f as PROGRAMS, u as useStore } from "./router-B2dalpiV.mjs";
import { i as PageHeader } from "./common-D0v8eWAw.mjs";
import { a as XAxis, c as Bar, d as ResponsiveContainer, f as Tooltip, i as YAxis, n as BarChart, o as Line, p as Legend, r as LineChart, s as CartesianGrid } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-DHfN6-Za.js
var import_jsx_runtime = require_jsx_runtime();
function Analytics() {
	const { scopedPeople } = useStore();
	const detected = scopedPeople.filter((p) => p.neet || p.status === "Направлен на программу").length;
	const checked = scopedPeople.filter((p) => p.neetReviewStatus === "Подтверждено" || p.neetReviewStatus === "На уточнении").length;
	const routed = scopedPeople.filter((p) => p.program).length;
	const succeeded = scopedPeople.filter((p) => p.outcome === "Трудоустроен" || p.outcome === "Учится").length;
	const funnel = [
		{
			stage: "Выявлен",
			value: detected
		},
		{
			stage: "Проверен",
			value: checked
		},
		{
			stage: "Направлен на программу",
			value: routed
		},
		{
			stage: "Трудоустроен / учится",
			value: succeeded
		}
	];
	const programRows = PROGRAMS.map((prog) => {
		const list = scopedPeople.filter((p) => p.program === prog);
		const ok = list.filter((p) => p.outcome === "Трудоустроен" || p.outcome === "Учится").length;
		return {
			program: prog,
			sent: list.length,
			ok,
			rate: list.length ? Math.round(ok / list.length * 100) : 0
		};
	});
	const monthly = [
		"Март",
		"Апрель",
		"Май",
		"Июнь",
		"Июль",
		"Август"
	].map((m, i) => ({
		month: m,
		Направлено: Math.max(3, Math.round(routed / 6 + i * 5 % 7 - 2)),
		Трудоустроено: Math.max(1, Math.round(succeeded / 6 + i * 3 % 5 - 1))
	}));
	const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Аналитика",
			subtitle: "Эффективность сопровождения молодёжи и программ поддержки"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold",
				children: "Воронка сопровождения"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 space-y-3",
				children: funnel.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-1 flex justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: f.stage
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted-foreground",
						children: [f.value, i > 0 && funnel[i - 1].value > 0 ? ` · ${Math.round(f.value / funnel[i - 1].value * 100)}% от пред. шага` : ""]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-8 overflow-hidden rounded-lg bg-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full rounded-lg bg-primary transition-all",
						style: {
							width: `${Math.max(f.value / maxFunnel * 100, 3)}%`,
							opacity: 1 - i * .15
						}
					})
				})] }, f.stage))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-semibold",
					children: "Эффективность программ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "border-b border-border text-xs text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-left font-medium",
									children: "Программа"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right font-medium",
									children: "Направлено"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right font-medium",
									children: "Успешные исходы"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "py-2 text-right font-medium",
									children: "%"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: programRows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border/60 last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3",
									children: r.program
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-right text-muted-foreground",
									children: r.sent
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-3 text-right text-muted-foreground",
									children: r.ok
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-3 text-right font-semibold text-success",
									children: [r.rate, "%"]
								})
							]
						}, r.program)) })]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-4 text-sm font-semibold",
					children: "Помесячная динамика направлений"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: 260,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: monthly,
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, { wrapperStyle: { fontSize: 11 } }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Направлено",
								fill: "#1d4ed8",
								radius: [
									4,
									4,
									0,
									0
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "Трудоустроено",
								fill: "#059669",
								radius: [
									4,
									4,
									0,
									0
								]
							})
						]
					})
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-4 rounded-xl border border-border bg-card p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-4 text-sm font-semibold",
				children: "Тренд успешных исходов"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: 240,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
					data: monthly,
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
							dataKey: "Трудоустроено",
							stroke: "#059669",
							strokeWidth: 2.5
						})
					]
				})
			})]
		})
	] });
}
//#endregion
export { Analytics as component };
