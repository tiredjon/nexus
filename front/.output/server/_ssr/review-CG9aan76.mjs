import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { m as Info } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as daysAgo, h as cn, p as REVIEW_STATUSES, u as useStore } from "./router-B2dalpiV.mjs";
import { a as StatusBadge, i as PageHeader, t as EmptyState } from "./common-D0v8eWAw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/review-CG9aan76.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLUMN_TONE = {
	"Ожидает проверки": "bg-warning",
	"На уточнении": "bg-primary",
	Подтверждено: "bg-danger",
	"Флаг снят": "bg-success"
};
function Review() {
	const { scopedPeople, setReviewStatus } = useStore();
	const [dragId, setDragId] = (0, import_react.useState)(null);
	const [over, setOver] = (0, import_react.useState)(null);
	const cases = scopedPeople.filter((p) => p.neet || p.neetReviewStatus !== "Флаг снят");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Требуют внимания",
			subtitle: `Случаев в работе: ${cases.length}`
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-4 shrink-0 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Флаг NEET — это сигнал для проверки уполномоченным сотрудником, а не окончательный административный статус." })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 lg:grid-cols-4",
			children: REVIEW_STATUSES.map((col) => {
				const items = cases.filter((p) => p.neetReviewStatus === col);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onDragOver: (e) => {
						e.preventDefault();
						setOver(col);
					},
					onDragLeave: () => setOver((o) => o === col ? null : o),
					onDrop: () => {
						if (dragId) {
							const person = cases.find((p) => p.id === dragId);
							setReviewStatus(dragId, col);
							toast.success(`Перемещено: ${col}`, { description: person?.fullName });
						}
						setDragId(null);
						setOver(null);
					},
					className: cn("rounded-xl border bg-muted/30 p-3 transition-colors", over === col ? "border-primary bg-primary/5" : "border-border"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2 px-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", COLUMN_TONE[col]) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-sm font-semibold",
								children: col
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-auto rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground",
								children: items.length
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { text: "Пусто" }), items.slice(0, 40).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							draggable: true,
							onDragStart: () => setDragId(p.id),
							onDragEnd: () => setDragId(null),
							className: cn("cursor-grab rounded-xl border border-border bg-card p-3 active:cursor-grabbing", dragId === p.id && "opacity-50"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: p.fullName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: [
										p.age,
										" лет · ",
										p.mahalla
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [daysAgo(p.lastUpdate), " дн."]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/person/$id",
									params: { id: p.id },
									className: "mt-2 inline-block text-xs font-medium text-primary hover:underline",
									children: "Открыть профиль →"
								})
							]
						}, p.id))]
					})]
				}, col);
			})
		})
	] });
}
//#endregion
export { Review as component };
