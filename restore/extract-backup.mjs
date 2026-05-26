/**
 * Extrai schema (public) + dados (public + auth.users/identities) do dump .backup descompactado.
 *
 * Uso:
 *   node restore/extract-backup.mjs
 *
 * Requer: db_cluster-27-01-2026.backup na raiz do projeto (gerado ao descompactar o .gz)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const gzPath = path.join(root, "db_cluster-27-01-2026@05-35-05.backup.gz");
const plainPath = path.join(root, "db_cluster-27-01-2026.backup");
const outDir = path.join(__dirname, "output");

const PUBLIC_TABLES_ORDER = [
  "coupons",
  "coupon_uses",
  "subjects",
  "subtopics",
  "user_settings",
  "user_xp",
  "user_achievements",
  "study_logs",
  "transactions",
  "feedback",
];

const AUTH_TABLES_ORDER = ["users", "identities"];

function ensurePlainBackup() {
  if (fs.existsSync(plainPath)) return plainPath;
  if (!fs.existsSync(gzPath)) {
    throw new Error(
      `Arquivo não encontrado. Coloque o backup em:\n  ${gzPath}`
    );
  }
  console.log("Descompactando .gz …");
  const buf = zlib.gunzipSync(fs.readFileSync(gzPath));
  fs.writeFileSync(plainPath, buf);
  return plainPath;
}

function extractSections(sql, pattern) {
  const sections = [];
  const lines = sql.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(pattern);
    if (!m) {
      i++;
      continue;
    }
    const block = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "\\.") {
      block.push(lines[i]);
      i++;
    }
    if (i < lines.length) block.push(lines[i]);
    sections.push({ name: m[1] || m[0], sql: block.join("\n") + "\n" });
    i++;
  }
  return sections;
}

function extractPublicSchema(sql) {
  const start = sql.indexOf("CREATE TABLE public.coupon_uses");
  const end = sql.indexOf("-- Data for Name: coupon_uses");
  if (start === -1 || end === -1) {
    throw new Error("Não foi possível localizar DDL public no dump.");
  }
  return `-- Schema public extraído do backup (27/01/2026)\n\n${sql.slice(start, end)}`;
}

function main() {
  const backupPath = ensurePlainBackup();
  const sql = fs.readFileSync(backupPath, "utf8");
  fs.mkdirSync(outDir, { recursive: true });

  const publicCopy = extractSections(sql, /^COPY public\.(\w+)/);
  const authCopy = extractSections(sql, /^COPY auth\.(\w+)/);

  const byPublicName = Object.fromEntries(
    publicCopy.map((s) => {
      const name = s.sql.match(/^COPY public\.(\w+)/)[1];
      return [name, s.sql];
    })
  );

  const dataPublicParts = [
    "-- Dados public (executar APÓS schema + usuários auth existirem)\n",
    "SET session_replication_role = replica;\n",
  ];
  for (const table of PUBLIC_TABLES_ORDER) {
    if (byPublicName[table]) {
      dataPublicParts.push(`-- ${table}\n`, byPublicName[table], "\n");
    }
  }
  dataPublicParts.push("SET session_replication_role = DEFAULT;\n");

  fs.writeFileSync(
    path.join(outDir, "01-schema-public.sql"),
    extractPublicSchema(sql)
  );
  fs.writeFileSync(
    path.join(outDir, "02-data-public.sql"),
    dataPublicParts.join("")
  );

  const authParts = [
    "-- AUTH: contém hashes de senha. NÃO commitar este arquivo.\n",
    "-- Restaurar auth em projeto Supabase novo costuma exigir fluxo oficial do painel.\n",
    "-- Use apenas se o suporte/documentação indicar importação manual.\n\n",
    "SET session_replication_role = replica;\n",
  ];
  for (const table of AUTH_TABLES_ORDER) {
    const block = authCopy.find((s) => s.sql.startsWith(`COPY auth.${table}`));
    if (block) authParts.push(`-- auth.${table}\n`, block.sql, "\n");
  }
  authParts.push("SET session_replication_role = DEFAULT;\n");
  fs.writeFileSync(path.join(outDir, "03-data-auth.sql"), authParts.join(""));

  const summary = {
    backupDate: "2026-01-27",
    authUsers: (byPublicName.users ? 0 : (authCopy.find((s) => s.sql.startsWith("COPY auth.users"))?.sql.match(/\n/g)?.length || 0)),
    tables: {},
  };

  for (const table of PUBLIC_TABLES_ORDER) {
    const block = byPublicName[table];
    if (!block) continue;
    const rows = block
      .split("\n")
      .filter((l) => l && !l.startsWith("COPY") && l.trim() !== "\\.").length;
    summary.tables[table] = rows;
  }

  const authBlock = authCopy.find((s) => s.sql.startsWith("COPY auth.users"));
  if (authBlock) {
    summary.authUsers = authBlock.sql
      .split("\n")
      .filter((l) => l && !l.startsWith("COPY") && l.trim() !== "\\.").length;
  }

  fs.writeFileSync(
    path.join(outDir, "00-summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log("Extração concluída em restore/output/");
  console.log(JSON.stringify(summary, null, 2));
}

main();
