import { i as __toESM } from "../_runtime.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime, u as Slot } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { C as ChartColumn, S as Check, b as ChevronUp, c as Radar, d as MapPinned, f as LogOut, i as TriangleAlert, l as Menu, n as Users, p as LayoutDashboard, s as RefreshCw, u as Map, w as Building2, x as ChevronDown } from "../_libs/lucide-react.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-DjTi_qin.js
var MAHALLAS = [
	"Дархан",
	"Буюк Ипак Йули",
	"Олтинтепа",
	"Элобод",
	"Гулзор",
	"Мингбулок",
	"Юзработ",
	"Козиробод",
	"Мустакиллик",
	"Бахор",
	"Салар",
	"Шахрисабз"
];
var STATUSES = [
	"Работает",
	"Безработный",
	"Учится",
	"Предприниматель",
	"Другая деятельность",
	"Статус не уточнён",
	"Направлен на программу"
];
var REVIEW_STATUSES = [
	"Ожидает проверки",
	"На уточнении",
	"Подтверждено",
	"Флаг снят"
];
var PROGRAMS = [
	"Профессиональное обучение",
	"Содействие в трудоустройстве",
	"Программа поддержки бизнеса",
	"Возвращение к обучению",
	"Молодёжная стажировка"
];
var MALE = [
	"Азиз",
	"Жасур",
	"Бекзод",
	"Отабек",
	"Шохрух",
	"Улугбек",
	"Санжар",
	"Дилшод",
	"Фаррух",
	"Тимур",
	"Рустам",
	"Хусан",
	"Икром",
	"Достон",
	"Мирзо"
];
var FEMALE = [
	"Нилуфар",
	"Мадина",
	"Зилола",
	"Дилноза",
	"Гулнора",
	"Севара",
	"Шахноза",
	"Малика",
	"Барно",
	"Умида",
	"Феруза",
	"Камола",
	"Ситора",
	"Наргиза"
];
var SURNAMES = [
	"Каримов",
	"Юсупов",
	"Рахимов",
	"Абдуллаев",
	"Тошматов",
	"Нортожиев",
	"Эргашев",
	"Мирзаев",
	"Хамидов",
	"Салимов",
	"Азизов",
	"Умаров",
	"Исмоилов",
	"Кодиров",
	"Файзиев"
];
var PATRON = ["угли", "кизи"];
var JOBS = [
	"Оператор call-центра",
	"Продавец-консультант",
	"Водитель",
	"Швея",
	"Программист",
	"Строитель",
	"Бухгалтер",
	"Учитель начальных классов",
	"Мастер по ремонту",
	"Логист"
];
var STUDIES = [
	"ТУИТ, 3 курс",
	"ТашГЭУ, 2 курс",
	"Колледж связи",
	"Медицинский колледж",
	"ТГТУ, 4 курс",
	"Педагогический институт"
];
var BUSINESS = [
	"Швейный цех",
	"Точка общепита",
	"Онлайн-магазин",
	"Барбершоп",
	"Кондитерская",
	"Ремонт техники"
];
var OTHER = [
	"Уход за ребёнком",
	"Помощь в семейном хозяйстве",
	"Военная служба",
	"Временные подработки"
];
function mulberry32(seed) {
	return function() {
		seed |= 0;
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function daysAgo(dateIso) {
	return Math.floor((Date.now() - new Date(dateIso).getTime()) / 864e5);
}
function isStale(p) {
	return daysAgo(p.lastUpdate) > 90;
}
function isoMinusDays(d) {
	return (/* @__PURE__ */ new Date(Date.now() - d * 864e5)).toISOString().slice(0, 10);
}
function formatDate(iso) {
	return new Date(iso).toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric"
	});
}
function generatePeople(count = 250) {
	const rnd = mulberry32(20260814);
	const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
	const people = [];
	for (let i = 0; i < count; i++) {
		const gender = rnd() > .5 ? "Мужской" : "Женский";
		const first = gender === "Мужской" ? pick(MALE) : pick(FEMALE);
		const fullName = `${pick(SURNAMES)}${gender === "Женский" ? "а" : ""} ${first} ${gender === "Мужской" ? PATRON[0] : PATRON[1]}`;
		const age = 18 + Math.floor(rnd() * 13);
		const mahalla = pick(MAHALLAS);
		const r = rnd();
		let status;
		if (r < .42) status = "Работает";
		else if (r < .62) status = "Учится";
		else if (r < .78) status = "Безработный";
		else if (r < .86) status = "Предприниматель";
		else if (r < .93) status = "Другая деятельность";
		else status = "Статус не уточнён";
		let activity = "—";
		if (status === "Работает") activity = pick(JOBS);
		else if (status === "Учится") activity = pick(STUDIES);
		else if (status === "Предприниматель") activity = pick(BUSINESS);
		else if (status === "Другая деятельность") activity = pick(OTHER);
		else if (status === "Безработный") activity = "Ищет работу";
		else activity = "Данные не подтверждены";
		const neet = status === "Безработный" || status === "Статус не уточнён" && rnd() > .35;
		const updDays = rnd() > .75 ? 95 + Math.floor(rnd() * 200) : Math.floor(rnd() * 85);
		const lastUpdate = isoMinusDays(updDays);
		const history = [];
		const evCount = 2 + Math.floor(rnd() * 4);
		let base = 400;
		const seeds = [
			"Первичный учёт в реестре махалли",
			"Обновление данных подворного обхода",
			"Собеседование с инспектором махалли",
			"Направлен на проф. обучение",
			"Участие в ярмарке вакансий",
			"Трудоустроен"
		];
		for (let e = 0; e < evCount; e++) {
			base -= 20 + Math.floor(rnd() * 90);
			history.push({
				date: isoMinusDays(Math.max(base, updDays)),
				title: seeds[e % seeds.length]
			});
		}
		history.sort((a, b) => a.date.localeCompare(b.date));
		history.push({
			date: lastUpdate,
			title: `Актуальный статус: ${status}`
		});
		const rs = rnd();
		const neetReviewStatus = !neet ? "Флаг снят" : rs < .5 ? "Ожидает проверки" : rs < .72 ? "На уточнении" : rs < .9 ? "Подтверждено" : "Флаг снят";
		people.push({
			id: `Y-${1e3 + i}`,
			fullName,
			age,
			gender,
			mahalla,
			status,
			activity,
			lastUpdate,
			needsSupport: neet ? rnd() > .25 : rnd() > .85,
			neet,
			neetReviewStatus,
			hasProfession: rnd() > .5,
			businessInterest: rnd() > .75,
			droppedStudies: rnd() > .8,
			history,
			program: null,
			outcome: null
		});
	}
	for (const p of people) if (p.neet && p.neetReviewStatus === "Подтверждено" && rnd() > .4) {
		p.program = pick(PROGRAMS);
		p.status = "Направлен на программу";
		p.outcome = rnd() > .55 ? rnd() > .6 ? "Трудоустроен" : "Учится" : "В процессе";
		p.history.push({
			date: isoMinusDays(10 + Math.floor(rnd() * 60)),
			title: `Направлен на программу: ${p.program}`
		});
		if (p.outcome !== "В процессе") p.history.push({
			date: isoMinusDays(5 + Math.floor(rnd() * 20)),
			title: `Результат: ${p.outcome}`
		});
	}
	return people;
}
function neetMonthlyTrend(people) {
	const months = [
		"Март",
		"Апрель",
		"Май",
		"Июнь",
		"Июль",
		"Август"
	];
	const total = people.filter((p) => p.neet).length;
	return months.map((m, i) => ({
		month: m,
		neet: Math.round(total * (1.22 - i * .04) + i * 7 % 5)
	}));
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-B2dalpiV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-CafJWoWb.css";
var StoreContext = (0, import_react.createContext)(null);
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function StoreProvider({ children }) {
	const [people, setPeople] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [session, setSession] = (0, import_react.useState)(null);
	const [syncedAt] = (0, import_react.useState)(() => /* @__PURE__ */ new Date(Date.now() - 252e4));
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem("yr-session");
			if (raw) setSession(JSON.parse(raw));
		} catch {}
		const t = setTimeout(() => {
			setPeople(generatePeople(250));
			setLoading(false);
		}, 350);
		return () => clearTimeout(t);
	}, []);
	const update = (0, import_react.useCallback)((id, fn) => {
		setPeople((prev) => prev.map((p) => p.id === id ? fn(p) : p));
	}, []);
	const value = (0, import_react.useMemo)(() => {
		const scopedPeople = session?.role === "mahalla" && session.mahalla ? people.filter((p) => p.mahalla === session.mahalla) : people;
		return {
			loading,
			people,
			scopedPeople,
			session,
			syncedAt,
			signIn: (s) => {
				setSession(s);
				try {
					localStorage.setItem("yr-session", JSON.stringify(s));
				} catch {}
			},
			signOut: () => {
				setSession(null);
				try {
					localStorage.removeItem("yr-session");
				} catch {}
			},
			routeToProgram: (id, program, comment) => update(id, (p) => ({
				...p,
				program,
				status: "Направлен на программу",
				outcome: "В процессе",
				lastUpdate: today(),
				neetReviewStatus: "Подтверждено",
				history: [...p.history, {
					date: today(),
					title: `Направлен на программу: ${program}`,
					note: comment || void 0
				}]
			})),
			confirmStatus: (id) => update(id, (p) => ({
				...p,
				lastUpdate: today(),
				neetReviewStatus: p.neet ? "Подтверждено" : p.neetReviewStatus,
				history: [...p.history, {
					date: today(),
					title: "Статус подтверждён сотрудником"
				}]
			})),
			requestClarification: (id) => update(id, (p) => ({
				...p,
				neetReviewStatus: "На уточнении",
				history: [...p.history, {
					date: today(),
					title: "Запрошено уточнение данных"
				}]
			})),
			setReviewStatus: (id, status) => update(id, (p) => ({
				...p,
				neetReviewStatus: status,
				lastUpdate: today(),
				history: [...p.history, {
					date: today(),
					title: `Проверка NEET: ${status}`
				}]
			}))
		};
	}, [
		people,
		loading,
		session,
		syncedAt,
		update
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreContext.Provider, {
		value,
		children
	});
}
function useStore() {
	const ctx = (0, import_react.useContext)(StoreContext);
	if (!ctx) throw new Error("useStore must be used within StoreProvider");
	return ctx;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
function RolePicker() {
	const { signIn } = useStore();
	const [role, setRole] = (0, import_react.useState)("district");
	const [mahalla, setMahalla] = (0, import_react.useState)(MAHALLAS[0]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-11 items-center justify-center rounded-xl bg-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, { className: "size-6 text-primary-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold tracking-tight",
						children: "Yoshlar Radar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Мониторинг занятости молодёжи · Мирзо-Улугбекский район"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm font-medium",
					children: "Выберите роль для входа"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleCard, {
						active: role === "mahalla",
						onClick: () => setRole("mahalla"),
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPinned, { className: "size-5" }),
						title: "Инспектор махалли",
						desc: "Доступ только к данным своей махалли"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleCard, {
						active: role === "district",
						onClick: () => setRole("district"),
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" }),
						title: "Сотрудник хокимията района",
						desc: "Доступ ко всем 12 махаллям района"
					})]
				}),
				role === "mahalla" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Махалля"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: mahalla,
						onValueChange: (v) => setMahalla(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "mt-1.5 w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: MAHALLAS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: m,
							children: m
						}, m)) })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6 w-full",
					size: "lg",
					onClick: () => signIn({
						role,
						mahalla: role === "mahalla" ? mahalla : null
					}),
					children: "Войти в систему"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-center text-xs text-muted-foreground",
					children: "Демонстрационный прототип. Все данные синтетические, реальные персональные данные не используются."
				})
			]
		})
	});
}
function RoleCard({ active, onClick, icon, title, desc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-colors", active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("mt-0.5", active ? "text-primary" : "text-muted-foreground"),
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-muted-foreground",
			children: desc
		})] })]
	});
}
var NAV = [
	{
		to: "/",
		label: "Дашборд",
		icon: LayoutDashboard
	},
	{
		to: "/map",
		label: "Карта района",
		icon: Map
	},
	{
		to: "/registry",
		label: "Реестр молодёжи",
		icon: Users
	},
	{
		to: "/review",
		label: "Требуют внимания",
		icon: TriangleAlert
	},
	{
		to: "/analytics",
		label: "Аналитика",
		icon: ChartColumn
	}
];
function AppShell({ children }) {
	const { session, signOut, syncedAt, loading } = useStore();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RolePicker, {});
	const active = (to) => to === "/" ? pathname === "/" : pathname.startsWith(to);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-5 py-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-9 items-center justify-center rounded-xl bg-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, { className: "size-5 text-primary-foreground" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-semibold leading-tight",
							children: "Yoshlar Radar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "Мирзо-Улугбекский район"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex-1 space-y-1 px-3",
						children: NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							onClick: () => setOpen(false),
							className: cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, { className: "size-4" }), item.label]
						}, item.to))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "m-3 rounded-xl border border-border bg-muted/40 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-medium text-muted-foreground",
								children: "Текущая роль"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-sm font-semibold",
								children: session.role === "mahalla" ? "Инспектор махалли" : "Сотрудник хокимията района"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground",
								children: session.role === "mahalla" ? `Махалля ${session.mahalla}` : "Все 12 махаллей"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "mt-3 w-full",
								onClick: signOut,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" }), " Сменить роль"]
							})
						]
					})
				]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 bg-foreground/20 lg:hidden",
				onClick: () => setOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur lg:px-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "lg:hidden",
						onClick: () => setOpen(true),
						"aria-label": "Меню",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-4 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU", {
							weekday: "long",
							day: "numeric",
							month: "long",
							year: "numeric"
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "hidden items-center gap-1.5 sm:flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-3.5" }),
								"Последняя синхронизация данных:",
								" ",
								syncedAt.toLocaleTimeString("ru-RU", {
									hour: "2-digit",
									minute: "2-digit"
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 px-4 py-6 lg:px-8",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageSkeleton, {}) : children
				})]
			})
		]
	});
}
function PageSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-64 animate-pulse rounded-lg bg-muted" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
				children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 animate-pulse rounded-xl bg-muted" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-72 animate-pulse rounded-xl bg-muted" })
		]
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$6 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Yoshlar Radar — мониторинг занятости молодёжи" },
			{
				name: "description",
				content: "Внутренняя система мониторинга занятости молодёжи и маршрутизации на программы поддержки."
			},
			{
				name: "author",
				content: "Хокимият Мирзо-Улугбекского района"
			},
			{
				property: "og:title",
				content: "Yoshlar Radar"
			},
			{
				property: "og:description",
				content: "Мониторинг занятости молодёжи по махаллям Мирзо-Улугбекского района."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$6.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StoreProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-right",
			richColors: true
		})] })
	});
}
var $$splitComponentImporter$5 = () => import("./routes-Dm6gFwr8.mjs");
var Route$5 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Дашборд — Yoshlar Radar" },
		{
			name: "description",
			content: "Ключевые показатели занятости молодёжи Мирзо-Улугбекского района: занятость, безработица, NEET."
		},
		{
			property: "og:title",
			content: "Дашборд — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "Ключевые показатели занятости молодёжи по махаллям района."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./analytics-DHfN6-Za.mjs");
var Route$4 = createFileRoute("/analytics")({
	head: () => ({ meta: [
		{ title: "Аналитика — Yoshlar Radar" },
		{
			name: "description",
			content: "Воронка сопровождения, эффективность программ поддержки и месячные тренды."
		},
		{
			property: "og:title",
			content: "Аналитика — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "Эффективность программ поддержки молодёжи."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./map-twaWneea.mjs");
var Route$3 = createFileRoute("/map")({
	head: () => ({ meta: [
		{ title: "Карта района — Yoshlar Radar" },
		{
			name: "description",
			content: "Карта Мирзо-Улугбекского района: агрегированные показатели занятости молодёжи по махаллям."
		},
		{
			property: "og:title",
			content: "Карта района — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "Агрегированные показатели NEET по махаллям."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./registry-ByySDCnx.mjs");
var Route$2 = createFileRoute("/registry")({
	validateSearch: (s) => typeof s["mahalla"] === "string" ? { mahalla: s["mahalla"] } : {},
	head: () => ({ meta: [
		{ title: "Реестр молодёжи — Yoshlar Radar" },
		{
			name: "description",
			content: "Поиск и фильтрация профилей молодёжи по махаллям, статусу занятости и NEET."
		},
		{
			property: "og:title",
			content: "Реестр молодёжи — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "Реестр молодёжи Мирзо-Улугбекского района."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./review-CG9aan76.mjs");
var Route$1 = createFileRoute("/review")({
	head: () => ({ meta: [
		{ title: "Требуют внимания — Yoshlar Radar" },
		{
			name: "description",
			content: "Очередь проверки флагов NEET: канбан-доска по стадиям верификации."
		},
		{
			property: "og:title",
			content: "Требуют внимания — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "Очередь проверки флагов NEET по махаллям района."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./person._id-C950Rns9.mjs");
var Route = createFileRoute("/person/$id")({
	head: () => ({ meta: [
		{ title: "Профиль молодого человека — Yoshlar Radar" },
		{
			name: "description",
			content: "Карточка профиля: история статусов и рекомендуемые направления поддержки."
		},
		{
			property: "og:title",
			content: "Профиль — Yoshlar Radar"
		},
		{
			property: "og:description",
			content: "История статусов и маршрутизация на программы."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$5.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$6
	}),
	AnalyticsRoute: Route$4.update({
		id: "/analytics",
		path: "/analytics",
		getParentRoute: () => Route$6
	}),
	MapRoute: Route$3.update({
		id: "/map",
		path: "/map",
		getParentRoute: () => Route$6
	}),
	RegistryRoute: Route$2.update({
		id: "/registry",
		path: "/registry",
		getParentRoute: () => Route$6
	}),
	ReviewRoute: Route$1.update({
		id: "/review",
		path: "/review",
		getParentRoute: () => Route$6
	}),
	PersonIdRoute: Route.update({
		id: "/person/$id",
		path: "/person/$id",
		getParentRoute: () => Route$6
	})
};
var routeTree = Route$6._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { formatDate as _, SelectContent as a, SelectValue as c, MAHALLAS as d, PROGRAMS as f, daysAgo as g, cn as h, Select as i, Button as l, STATUSES as m, Route as n, SelectItem as o, REVIEW_STATUSES as p, Route$2 as r, SelectTrigger as s, router_exports as t, useStore as u, isStale as v, neetMonthlyTrend as y };
