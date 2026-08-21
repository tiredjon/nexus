import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

function geojsonPlugin(): Plugin {
  return {
    name: "geojson-loader",
    transform(code, id) {
      if (id.endsWith(".geojson")) {
        return { code: `export default ${code}`, map: null };
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins = [
    geojsonPlugin(),
    ...(mode === "development"
      ? [
          devtools({
            logging: false,
            eventBusConfig: { enabled: false },
            enhancedLogs: { enabled: false },
            consolePiping: { enabled: false },
            removeDevtoolsOnBuild: true,
            injectSource: { enabled: false },
          }),
        ]
      : []),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    // maxDuration задаём здесь, а не в vercel.json: nitro собирает Build Output
    // API (.vercel/output), и поле functions из vercel.json туда не доезжает.
    // 60 с — потолок Hobby-плана; дефолтные 10 с малы, самая тяжёлая ИИ-фича
    // (официальная справка) отвечает за 6–7 с и с ретраем упирается в лимит.
    ...(command === "build"
      ? [nitro({ defaultPreset: "vercel", vercel: { functions: { maxDuration: 60 } } })]
      : []),
    viteReact(),
  ];

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
  };
});
