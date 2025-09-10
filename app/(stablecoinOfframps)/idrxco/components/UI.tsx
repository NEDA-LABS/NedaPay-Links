export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-slate-600 p-5 shadow-sm">{children}</div>
  );
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold mb-3">{children}</h2>;
}
export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 border text-sm font-medium hover:shadow ${
        props.className ?? ""
      }`}
    />
  );
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border p-2 ${props.className ?? ""}`}
    />
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1">{children}</label>;
}
