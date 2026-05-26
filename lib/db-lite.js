import { connect } from "@tursodatabase/serverless";

let client;

function getClient() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("Missing environment variable: TURSO_DATABASE_URL");
  }

  const config = { url };
  if (authToken) config.authToken = authToken;
  client = connect(config);
  return client;
}

export async function executeQuery(sql, params) {
  try {
    return await getClient().execute(sql, params);
  } catch (err) {
    console.error("Database query failed:", err.message);
    throw err;
  }
}

const clientObject = {
  execute(sql, args) {
    return getClient().execute(sql, args);
  },
  batch(stmts, mode) {
    return getClient().batch(stmts, mode);
  },
  close() {
    return getClient().close();
  },
};

export default clientObject;
