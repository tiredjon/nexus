import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Тесты гоняются против одной реальной БД, которая чистится TRUNCATE в
    // beforeEach — параллельные файлы затирали бы данные друг друга.
    fileParallelism: false,
    include: ["test/**/*.test.ts"],
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
