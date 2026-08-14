import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { E as BookOpen, O as ArrowLeft, T as Briefcase, a as Store, g as Dot, h as GraduationCap, t as X, v as CircleQuestionMark, y as CircleCheck } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as formatDate, a as SelectContent, c as SelectValue, f as PROGRAMS, g as daysAgo, h as cn, i as Select, l as Button, n as Route, o as SelectItem, s as SelectTrigger, u as useStore } from "./router-B2dalpiV.mjs";
import { a as StatusBadge, r as NeetBadge, t as EmptyState } from "./common-D0v8eWAw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/person._id-C950Rns9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
function suggestions(p) {
	const list = [];
	const jobless = p.status === "Безработный" || p.status === "Статус не уточнён";
	if (jobless && !p.hasProfession) list.push({
		program: "Профессиональное обучение",
		reason: "Безработный, профессия не указана — требуется базовая профподготовка.",
		icon: GraduationCap
	});
	if (jobless && p.hasProfession) list.push({
		program: "Содействие в трудоустройстве",
		reason: "Безработный, но есть профессиональные навыки — подбор вакансии и сопровождение.",
		icon: Briefcase
	});
	if (p.businessInterest) list.push({
		program: "Программа поддержки бизнеса",
		reason: "Отмечен интерес к предпринимательству — субсидии и бизнес-наставничество.",
		icon: Store
	});
	if (p.droppedStudies) list.push({
		program: "Возвращение к обучению",
		reason: "Обучение не завершено — восстановление в колледже или вузе.",
		icon: BookOpen
	});
	if (list.length === 0) list.push({
		program: "Молодёжная стажировка",
		reason: "Устойчивый статус, но возможна поддержка карьерного роста через стажировку.",
		icon: Briefcase
	});
	return list;
}
function PersonPage() {
	const { id } = Route.useParams();
	const { scopedPeople, routeToProgram, confirmStatus, requestClarification } = useStore();
	const person = scopedPeople.find((p) => p.id === id);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [program, setProgram] = (0, import_react.useState)(PROGRAMS[0]);
	const [comment, setComment] = (0, import_react.useState)("");
	if (!person) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { text: "Профиль не найден или недоступен в рамках вашей территории." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/registry",
				className: "text-sm text-primary hover:underline",
				children: "Вернуться в реестр"
			})
		})]
	});
	const history = [...person.history].sort((a, b) => a.date.localeCompare(b.date));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/registry",
			className: "mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " К реестру"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-xl border border-border bg-card p-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl font-semibold tracking-tight",
								children: person.fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: person.status }),
							person.neet && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NeetBadge, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: [
							person.age,
							" лет · ",
							person.gender,
							" · махалля ",
							person.mahalla,
							" · ID ",
							person.id
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: [
							"Деятельность: ",
							person.activity,
							" · обновлено ",
							formatDate(person.lastUpdate),
							" (",
							daysAgo(person.lastUpdate),
							" дн. назад)"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => {
							confirmStatus(person.id);
							toast.success("Статус подтверждён", { description: "Событие добавлено в историю." });
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " Подтвердить статус (проверено)"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => {
							requestClarification(person.id);
							toast("Запрошено уточнение", { description: "Дело переведено в статус «На уточнении»." });
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "size-4" }), " Запросить уточнение"]
					})]
				})]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: "История статусов"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-5 space-y-0",
					children: history.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "relative flex gap-4 pb-6 last:pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dot, { className: "size-5" })
							}), i < history.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-px flex-1 bg-border" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pb-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: formatDate(e.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: e.title
								}),
								e.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 text-xs text-muted-foreground",
									children: e.note
								})
							]
						})]
					}, i))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: "Рекомендуемые направления поддержки"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 space-y-3",
						children: suggestions(person).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl border border-border p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold",
											children: s.program
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-xs text-muted-foreground",
											children: ["Основание: ", s.reason]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										onClick: () => {
											setProgram(s.program);
											setOpen(true);
										},
										children: "Направить"
									})
								]
							})
						}, s.program))
					}),
					person.program && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 rounded-lg bg-success/10 p-3 text-xs text-success",
						children: ["Уже направлен на программу: ", person.program]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs text-muted-foreground",
						children: "Рекомендации носят справочный характер. Решение принимает уполномоченный сотрудник."
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open,
			onOpenChange: setOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Направление на программу поддержки" }) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Программа"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: program,
						onValueChange: (v) => setProgram(v),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
							className: "mt-1.5 w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: PROGRAMS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: p,
							children: p
						}, p)) })]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-sm font-medium",
						children: "Комментарий сотрудника"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-1.5",
						value: comment,
						onChange: (e) => setComment(e.target.value),
						placeholder: "Например: согласовано с инспектором махалли, начало обучения с сентября"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => setOpen(false),
					children: "Отмена"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						routeToProgram(person.id, program, comment);
						setOpen(false);
						setComment("");
						toast.success("Направление оформлено", { description: `${person.fullName} → ${program}` });
					},
					children: "Подтвердить направление"
				})] })
			] })
		})
	] });
}
//#endregion
export { PersonPage as component };
