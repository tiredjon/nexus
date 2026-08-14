import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { g as daysAgo, h as cn } from "./router-B2dalpiV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/common-D0v8eWAw.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLE = {
	Работает: "bg-success/10 text-success border-success/20",
	Учится: "bg-primary/10 text-primary border-primary/20",
	Предприниматель: "bg-chart-5/10 text-chart-5 border-chart-5/25",
	"Другая деятельность": "bg-muted text-muted-foreground border-border",
	Безработный: "bg-danger/10 text-danger border-danger/20",
	"Статус не уточнён": "bg-warning/15 text-warning border-warning/30",
	"Направлен на программу": "bg-primary/10 text-primary border-primary/20"
};
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLE[status]),
		children: status
	});
}
function NeetBadge() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex items-center rounded-full border border-danger/25 bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger",
		children: "NEET"
	});
}
function FreshnessDot({ person }) {
	const d = daysAgo(person.lastUpdate);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-2 rounded-full", d > 90 ? "bg-danger" : d > 45 ? "bg-warning" : "bg-success") }),
			"обновлено ",
			d,
			" дн. назад"
		]
	});
}
function PageHeader({ title, subtitle, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-6 flex flex-wrap items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold tracking-tight",
			children: title
		}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: subtitle
		})] }), children]
	});
}
function EmptyState({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground",
		children: text
	});
}
//#endregion
export { StatusBadge as a, PageHeader as i, FreshnessDot as n, NeetBadge as r, EmptyState as t };
