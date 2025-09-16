// ===============================================================
// components/idrx/OnboardManagedUserCard.tsx — POST /api/auth/onboarding
// (Managed user under your org; multipart with idFile)
// ===============================================================
"use client";
import { useState } from "react";
import { Card, CardTitle, Button, Input, Label } from "./UI";

export default function OnboardManagedUserCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
      const res = await fetch("/api/idrx/onboarding", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      setResult(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Onboard a new managed user</CardTitle>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label>Full name</Label>
          <Input name="fullname" required placeholder="JOHN SMITH" />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            required
            placeholder="[email protected]"
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input name="address" required placeholder="Address line" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ID Number</Label>
            <Input name="idNumber" required placeholder="e.g. KTP/Passport" />
          </div>
          <div>
            <Label>ID File</Label>
            <Input type="file" name="idFile" accept="image/*,.pdf" required />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Onboard"}
        </Button>
      </form>
      {result && (
        <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </Card>
  );
}
