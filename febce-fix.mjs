// Ejecutar con: npx vite-node scripts/apply-fence-merge.mjs
//
// Aplica la fusión de fences rotos directamente sobre
// src/quiz/data/databricks-dea/exams.ts. Crea exams.ts.bak antes de
// escribir, así que si algo sale mal puedes restaurar con:
//   cp src/quiz/data/databricks-dea/exams.ts.bak src/quiz/data/databricks-dea/exams.ts
//
// Excluye explícitamente los casos ya revisados como legítimos (dos
// bloques de código reales separados por una frase de transición, o
// preguntas "fill in the blank" con el hueco fuera del código):
//   - exam1 n16 (q)   -> "and later runs:" entre dos comandos reales
//   - exam2 n10 (q)   -> fill-in-the-blank, hueco fuera del código
//   - exam2 n39 (q)   -> fill-in-the-blank, hueco fuera del código
//   - exam5 n4  (q)   -> "Later, the team runs:" entre dos statements reales
//   - exam5 n50 (q)   -> "Later, the team runs:" entre dos statements reales
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { QUESTION_BANK } from './src/quiz/data/bank';

const TARGET_FILE = 'src/quiz/data/databricks-dea/exams.ts';

const EXCLUDED = new Set([
  'databricks-dea-116:q',
  'databricks-dea-210:q',
  'databricks-dea-239:q',
  'databricks-dea-504:q',
  'databricks-dea-550:q',
]);

function mergeFences(text) {
  const idxs = [];
  let idx = text.indexOf('```');
  while (idx !== -1) {
    idxs.push(idx);
    idx = text.indexOf('```', idx + 3);
  }
  if (idxs.length < 4) return null;

  const first = idxs[0];
  const lastEnd = idxs[idxs.length - 1] + 3;
  const prefix = text.slice(0, first);
  const suffix = text.slice(lastEnd);
  const block = text.slice(first, lastEnd);

  const langMatch = block.match(/^```([a-zA-Z]*)\n?/);
  const lang = langMatch ? langMatch[1] : '';
  const inner = block.replace(/```[a-zA-Z]*\n?/g, '').trim();

  return `${prefix}\`\`\`${lang}\n${inner}\n\`\`\`${suffix}`;
}

// Mirrors how these strings are written as single-quoted TS literals in
// the source file: real newlines become the two-character sequence \n,
// backslashes and single quotes get escaped. Matches the plain style
// used throughout exams.ts (see the pasted source: `q: '...\\n```\\n...'`).
function toSourceLiteral(s) {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, "\\'");
}

let content = readFileSync(TARGET_FILE, 'utf8');
copyFileSync(TARGET_FILE, `${TARGET_FILE}.bak`);
console.log(`Backup creado: ${TARGET_FILE}.bak`);

let applied = 0;
let skippedExcluded = 0;
const failures = [];

for (const q of QUESTION_BANK) {
  if (q.certId !== 'databricks-dea') continue;

  const fields = [
    { name: 'q', text: q.q },
    { name: 'x', text: q.x },
    ...q.o.map((opt, i) => [`o[${i}]`, opt]).map(([name, text]) => ({ name, text })),
  ];

  for (const field of fields) {
    const key = `${q.id}:${field.name}`;
    const merged = mergeFences(field.text);
    if (!merged) continue;

    if (EXCLUDED.has(key)) {
      skippedExcluded += 1;
      continue;
    }

    const oldLiteral = toSourceLiteral(field.text);
    const newLiteral = toSourceLiteral(merged);

    const occurrences = content.split(oldLiteral).length - 1;
    if (occurrences !== 1) {
      failures.push({ key, occurrences });
      continue;
    }

    content = content.split(oldLiteral).join(newLiteral);
    applied += 1;
    console.log(`  ✓ ${key}`);
  }
}

if (failures.length > 0) {
  console.log('\nNO se aplicaron (no se encontró exactamente 1 coincidencia en el archivo):');
  console.table(failures);
  console.log('El archivo NO fue modificado en disco debido a estos fallos. Revisa manualmente.');
  process.exitCode = 1;
} else {
  writeFileSync(TARGET_FILE, content, 'utf8');
  console.log(`\nAplicados: ${applied}`);
  console.log(`Excluidos (legítimos, sin tocar): ${skippedExcluded}`);
  console.log(`Archivo actualizado: ${TARGET_FILE}`);
}
