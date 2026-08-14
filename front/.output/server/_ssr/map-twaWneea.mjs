import { y as ClientOnly } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { m as Info } from "../_libs/lucide-react.mjs";
import { i as PageHeader } from "./common-D0v8eWAw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/map-twaWneea.js
var import_jsx_runtime = require_jsx_runtime();
function MapPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			title: "Карта района",
			subtitle: "Масштабируйте карту: Узбекистан → районы Ташкента → махалли Мирзо-Улугбек"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-xl border border-border bg-card p-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientOnly, { fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[540px] animate-pulse rounded-xl bg-muted" }) })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					color: "bg-success",
					label: "Доля NEET < 5%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					color: "bg-warning",
					label: "Доля NEET 5–12%"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
					color: "bg-danger",
					label: "Доля NEET > 12%"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mt-0.5 size-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Отображаются только агрегированные показатели по территориям. Точные адреса граждан не используются. Границы махаллей на карте являются приблизительными и служат для навигации, а не являются официальными кадастровыми границами." })]
		})
	] });
}
function Legend({ color, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2.5 rounded-full ${color}` }), label]
	});
}
//#endregion
export { MapPage as component };
