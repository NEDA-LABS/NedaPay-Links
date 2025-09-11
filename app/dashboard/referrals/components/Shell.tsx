// /components/Shell.tsx
'use client'
import { ReactNode } from 'react'


export default function Shell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
return (
<div className="min-h-screen p-6 md:p-10 space-y-6">
<header className="flex items-center justify-between">
<h1 className="text-2xl md:text-3xl">{title}</h1>
<div className="flex items-center gap-3">{actions}</div>
</header>
<main className="space-y-6">{children}</main>
</div>
)
}