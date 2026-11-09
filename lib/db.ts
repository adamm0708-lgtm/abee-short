const base = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function configured() {
  return Boolean(base && key);
}

export async function db(path: string, init: RequestInit = {}) {
  if (!base || !key) throw new Error("Supabase belum dikonfigurasi.");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  headers.set("Content-Type", "application/json");
  const cleanPath = path.replace(/^\/+/, "");
  const response = await fetch(`${base}/rest/v1/${cleanPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(body || `Supabase error ${response.status}`);
  }
  return body ? JSON.parse(body) : null;
}

export function isAdmin(request: Request) {
  const password = process.env.ABEE_ADMIN_PASSWORD;
  return Boolean(password) && request.headers.get("x-admin-password") === password;
}
