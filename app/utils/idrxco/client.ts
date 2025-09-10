// ===============================================================
// thin fetcher to our internal API routes
// ===============================================================
export type ApiResponse<T> = { statusCode: number; message: string; data: T };


export async function api<T>(path: string, init?: RequestInit) {
const res = await fetch(path, init);
if (!res.ok) throw new Error(await res.text());
return (await res.json()) as ApiResponse<T>;
}