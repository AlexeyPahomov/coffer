/**
 * Prisma 7 генерирует client.ts с import.meta.url; при сборке Nest (CJS) в dist
 * остаётся import.meta, и Node трактует файл как ESM → "exports is not defined".
 * После generate подменяем на __dirname (корректно в скомпилированном CJS).
 */
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, '../src/generated/prisma/client.ts');
if (!fs.existsSync(clientPath)) {
  process.exit(0);
}

let s = fs.readFileSync(clientPath, 'utf8');
const needle =
  "globalThis['__dirname'] = path.dirname(fileURLToPath(import.meta.url))";
if (!s.includes(needle)) {
  // Уже пропатчено — идемпотентный повторный запуск.
  if (s.includes("globalThis['__dirname'] = __dirname")) {
    process.exit(0);
  }
  // Ожидаемой строки нет, но import.meta ещё присутствует → codegen Prisma
  // изменился и патч молча перестал срабатывать. Падаем громко, иначе CJS-сборка
  // Nest упадёт позже с непрозрачным "exports is not defined".
  if (s.includes('import.meta')) {
    console.error(
      '[patch-prisma-client] client.ts содержит import.meta, но ожидаемая строка для замены не найдена. ' +
        'Вероятно, изменился codegen Prisma — обновите needle в scripts/patch-prisma-client.cjs.',
    );
    process.exit(1);
  }
  // import.meta нет вовсе → Prisma больше не требует патча.
  console.warn(
    '[patch-prisma-client] import.meta в client.ts не найден — патч, похоже, больше не нужен (изменился codegen Prisma?).',
  );
  process.exit(0);
}

s = s.replace(needle, "globalThis['__dirname'] = __dirname");
s = s.replace(
  /import \{ fileURLToPath \} from 'node:url'\r?\n/,
  '',
);
s = s.replace(/\/\/ @ts-nocheck\s*\r?\n/, '');

fs.writeFileSync(clientPath, s);
