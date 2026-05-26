let dbUrl, authToken;

function init() {
  if (dbUrl) return;
  dbUrl = process.env.TURSO_DATABASE_URL;
  authToken = process.env.TURSO_AUTH_TOKEN;
  if (!dbUrl) throw new Error("Missing environment variable: TURSO_DATABASE_URL");
  dbUrl = `https://${dbUrl.replace(/^libsql:\/\//, "")}`;
}

function escape(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  // Escape single quotes by doubling them
  return `'${String(val).replace(/'/g, "''")}'`;
}

function interpolate(sql, args) {
  if (!args || args.length === 0) return sql;
  let i = 0;
  return sql.replace(/\?/g, () => escape(args[i++]));
}

async function exec(sql, args) {
  init();
  const fullSql = interpolate(sql, args);
  const body = JSON.stringify({
    requests: [{ type: "execute", stmt: { sql: fullSql } }],
  });
  const res = await fetch(`${dbUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken || ""}`,
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) throw new Error(`Turso API error: ${res.status}`);
  const data = await res.json();
  const r = data.results?.[0];
  if (r?.type === "error") throw new Error(r.error?.message || "Unknown database error");
  const result = r?.response?.result;
  if (!result) throw new Error("Empty result");
  return result;
}

function normalizeResult(result) {
  if (!result) return result;
  return {
    columns: (result.cols || []).map((c) => c.name),
    rows: (result.rows || []).map((row) => {
      const obj = {};
      (result.cols || []).forEach((col, i) => {
        const cell = row[i];
        obj[col.name] = cell?.value ?? null;
      });
      return obj;
    }),
    rowsAffected: result.affected_row_count ?? 0,
    lastInsertRowid: result.last_insert_rowid ?? null,
  };
}

export async function executeQuery(sql, params) {
  try {
    const result = await exec(sql, params);
    return normalizeResult(result);
  } catch (err) {
    console.error("Database query failed:", err.message);
    throw err;
  }
}

const clientObject = {
  async execute(sql, args) {
    const result = await exec(sql, args);
    return normalizeResult(result);
  },
};

export default clientObject;