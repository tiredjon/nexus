globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-08-14T13:33:41.942Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/analytics-D40fasAr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"12d9-damdEDnjbyw9A0wb6jG8r0tF5Ws\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 4825,
		"path": "../public/assets/analytics-D40fasAr.js"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-08-14T13:33:41.942Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/button-CGxps0SC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"751-VCtR5s7v2DiICu7fBaSppKHIo8U\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 1873,
		"path": "../public/assets/button-CGxps0SC.js"
	},
	"/assets/circle-question-mark-E53lmXC2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"19f-R0sJjQ6ZSFWbhMXlDgf928ip+Tc\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 415,
		"path": "../public/assets/circle-question-mark-E53lmXC2.js"
	},
	"/assets/common-BmLrWsZk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"725-ykjLIl6K3CnBQhocBvu4xSj+vNQ\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 1829,
		"path": "../public/assets/common-BmLrWsZk.js"
	},
	"/assets/createLucideIcon-XgyiFKb-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"596-LTdid5KVkDpt3iceS5sIMsu+tns\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 1430,
		"path": "../public/assets/createLucideIcon-XgyiFKb-.js"
	},
	"/assets/BarChart-QQlF4uKV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5cee5-Ce7hlPg0CBCW7BWwMKoEBBn7CHA\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 380645,
		"path": "../public/assets/BarChart-QQlF4uKV.js"
	},
	"/assets/info-DLwFP4Ov.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cc-2PK2pRhnYjLtmKcNYXZFipu1pnI\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 204,
		"path": "../public/assets/info-DLwFP4Ov.js"
	},
	"/assets/dist-CXjwcgZu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"bcd-ITJ1HYj168rj2fMdHtwj8jupKbY\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 3021,
		"path": "../public/assets/dist-CXjwcgZu.js"
	},
	"/assets/DistrictMap-_94qlB-b.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"56c0b-PURK9MuZM7a4j2Sfkski/oqsyos\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 355339,
		"path": "../public/assets/DistrictMap-_94qlB-b.js"
	},
	"/assets/dist-DQZ7CSP3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"830f-GNOQGGPHAyJVv4fVw6VcwH8GulA\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 33551,
		"path": "../public/assets/dist-DQZ7CSP3.js"
	},
	"/assets/link-D3f49rN0.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"5a43-QIIyL4RlceQziVEhkAHEqeKSJpw\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 23107,
		"path": "../public/assets/link-D3f49rN0.js"
	},
	"/assets/map-DCwqFBrS.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a87-5nY57MPYPTNmf3qsVtOXSXJAErM\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 2695,
		"path": "../public/assets/map-DCwqFBrS.js"
	},
	"/assets/person._id-UehSpVhc.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"47b-+Kyr599aOhVPOwwUyVu9LSG7O0I\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 1147,
		"path": "../public/assets/person._id-UehSpVhc.js"
	},
	"/assets/index-C5ciRm0q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4dd29-59b9xe4zdJaSR9fsQuOsaLO2aWc\"",
		"mtime": "2026-08-14T13:33:41.743Z",
		"size": 318761,
		"path": "../public/assets/index-C5ciRm0q.js"
	},
	"/assets/preload-helper-Czpn1I53.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ac-sE+5KsaRXTMfwOfrOATQajMSGV4\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 1196,
		"path": "../public/assets/preload-helper-Czpn1I53.js"
	},
	"/assets/registry-CayXgU1Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"443-k5eOLsb59ykFahbU5MkvLuDAhcw\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 1091,
		"path": "../public/assets/registry-CayXgU1Q.js"
	},
	"/assets/registry-zZY1cP3Q.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4ead-ituNNP23y+ntBJpHQ3BocmCch5Y\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 20141,
		"path": "../public/assets/registry-zZY1cP3Q.js"
	},
	"/assets/review-Bc9nxtLm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"b84-pJXvJB4daZ/EVaOsv0LP0PEut5g\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 2948,
		"path": "../public/assets/review-Bc9nxtLm.js"
	},
	"/assets/person._id-Cpfj7GjW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3cb6-N5wc2MRNiWdn9Wq95IeKsUrLxfg\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 15542,
		"path": "../public/assets/person._id-Cpfj7GjW.js"
	},
	"/assets/routes-C8yHbuw3.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"7d54-fpM7bZIUE/J3kmpMgcqLV1nDgZY\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 32084,
		"path": "../public/assets/routes-C8yHbuw3.js"
	},
	"/assets/store-BhTd_Ocn.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"766-C3aGe1jP+/lJ1VBZPgPO2OzcS5E\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 1894,
		"path": "../public/assets/store-BhTd_Ocn.js"
	},
	"/assets/select-DVUvnaoP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"16339-uISvcGR/uWwwYzIkZUybDfW/BPs\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 90937,
		"path": "../public/assets/select-DVUvnaoP.js"
	},
	"/assets/styles-CafJWoWb.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"13d08-JNEdItNF1grRXAgS7KMVTktxRpk\"",
		"mtime": "2026-08-14T13:33:41.745Z",
		"size": 81160,
		"path": "../public/assets/styles-CafJWoWb.css"
	},
	"/assets/useRouter-CWGGPPbi.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e35-Ne/LDn11pYyiQV7qGKOUpg5m5RM\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 3637,
		"path": "../public/assets/useRouter-CWGGPPbi.js"
	},
	"/assets/users-BwF40WZt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"206-w8g3riBsiyv6mnUm1ktvUUGFG3M\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 518,
		"path": "../public/assets/users-BwF40WZt.js"
	},
	"/assets/utils-dIGtD5H6.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a315-32lO7SgoZca9UT4bLuPMWgh4dsw\"",
		"mtime": "2026-08-14T13:33:41.744Z",
		"size": 41749,
		"path": "../public/assets/utils-dIGtD5H6.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_eR5kNS = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_eR5kNS
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
