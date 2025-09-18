// app/components/onboarding/onboarding-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { usePrivy } from '@privy-io/react-auth';

const onboardingSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullname: z.string().min(3, 'Full name must be at least 3 characters'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  idNumber: z.string().min(8, 'ID number must be at least 8 characters'),
  idFile: z.instanceof(File).refine((file) => file.size <= 5000000, 'File must be less than 5MB'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, getAccessToken } = usePrivy();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('fullname', data.fullname);
      formData.append('address', data.address);
      formData.append('idNumber', data.idNumber);
      formData.append('idFile', data.idFile);

      const tk = await getAccessToken();

      const response = await fetch('/api/idrxco/onboarding', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${tk}` },
      });

      const json = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = json?.message || 'Onboarding failed';
        const code = json?.statusCode || response.status;
        throw new Error(`${msg} (code ${code})`);
      }

      return json as { statusCode: number; message: string; data?: { id: number; fullname: string; createdAt: string } };
    },
    onSuccess: (payload) => {
      const name = payload?.data?.fullname || 'User';
      toast({
        title: 'Onboarding Complete',
        description: `${name} has been successfully onboarded.`,
      });
      // Optional: redirect after a short delay
      setTimeout(() => {
        try { window.location.href = '/dashboard'; } catch {}
      }, 600);
    },
    onError: (error: any) => {
      toast({
        title: 'Onboarding Error',
        description: error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: OnboardingFormData) => {
    setIsSubmitting(true);
    onboardingMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue('idFile', file);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-900/50">
      <CardHeader>
        <CardTitle>Onboard User to IDRXCO</CardTitle>
        <CardDescription>
          Add all necessary user information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                placeholder="John Doe"
                {...register('fullname')}
              />
              {errors.fullname && (
                <p className="text-sm text-red-600">{errors.fullname.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main Street, City, Country"
                {...register('address')}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                placeholder="12345678"
                {...register('idNumber')}
              />
              {errors.idNumber && (
                <p className="text-sm text-red-600">{errors.idNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="idFile">ID Document</Label>
              <Input
                id="idFile"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />
              {errors.idFile && (
                <p className="text-sm text-red-600">{errors.idFile.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant={"default"}
            className="w-full bg-green-900"
            disabled={isSubmitting || onboardingMutation.isPending}
          >
            {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}