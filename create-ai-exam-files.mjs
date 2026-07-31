// Ejecutar con: npx vite-node scripts/find-broken-fences.mjs
// Detecta opciones (o preguntas/explicaciones) cuyo texto tiene MÁS DE UN
// par de fences ``` en la misma cadena -- candidato a bloque de código
// partido accidentalmente en varios fences con texto suelto en medio,
// como el caso de exam5 n47 (CREATE OR REFRESH STREAMING TABLE ...).
import { QUESTION_BANK } from './src/quiz/data/bank';

function countFences(text) {
  const matches = text.match(/```/g);
  return matches ? matches.length : 0;
}

const findings = [];

for (const q of QUESTION_BANK) {
  const fields = [
    { name: 'q', text: q.q },
    { name: 'x', text: q.x },
    ...q.o.map((opt, i) => ({ name: `o[${i}]`, text: opt })),
  ];

  for (const field of fields) {
    const fenceCount = countFences(field.text);
    // 4+ fence markers = at least 2 separate ```...``` pairs in the same
    // string. A single well-formed code block only ever has 2.
    if (fenceCount >= 4) {
      findings.push({
        id: q.id,
        certId: q.certId,
        exam: q.exam,
        n: q.n,
        field: field.name,
        fenceCount,
        preview: field.text.slice(0, 80).replace(/\n/g, '\\n'),
      });
    }
  }
}

console.log(`Preguntas/opciones con posible fence roto: ${findings.length}`);
console.table(findings);
