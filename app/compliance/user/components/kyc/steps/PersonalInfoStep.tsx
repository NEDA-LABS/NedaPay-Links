
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { PersonalInfo } from '../../../types/kyc';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  countryOfResidence: z.string().min(1, 'Country of residence is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address'),
  address: z.object({
    street: z.string().min(5, 'Street address must be at least 5 characters'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    postalCode: z.string().min(4, 'Valid postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
});

interface PersonalInfoStepProps {
  onNext: (data: PersonalInfo) => void;
  initialData?: Partial<PersonalInfo>;
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Japan', 'Australia', 'Singapore', 'Switzerland', 'Other'
];

export function PersonalInfoStep({ onNext, initialData }: PersonalInfoStepProps) {
  const { user } = usePrivy();
  const form = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      middleName: initialData?.middleName || '',
      lastName: initialData?.lastName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      nationality: initialData?.nationality || '',
      countryOfResidence: initialData?.countryOfResidence || '',
      phoneNumber: initialData?.phoneNumber || '',
      email: initialData?.email || '',
      address: {
        street: initialData?.address?.street || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        postalCode: initialData?.address?.postalCode || '',
        country: initialData?.address?.country || '',
      },
    },
  });
  const [submittedInfo, setSubmittedInfo] = useState<boolean>(false);

  const onSubmit = async (data: PersonalInfo) => {
    try {
      // Transform the data to match the KYCApplication schema
      const formData = {
        ...data,
        userId: user?.id, // Using wallet as userId since it's unique
        wallet: user?.wallet?.address,
        status: 'PENDING_DOCUMENTS',
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        country: data.address.country,
      };

      

      // Keep the address object in the data passed to onNext
      const response = await fetch('/api/kyc/personal-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      toast.success('Personal information submitted successfully');
      setSubmittedInfo(true);
      onNext(data);
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error('Failed to submit personal information');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nationality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="countryOfResidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Residence *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter state" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-6">
          <p className="text-sm">Make sure to fill all the required fields correctly, if you click continue you can't go back</p>
          <Button type="submit" className="!px-8 border-2 !border-blue-500 hover:!bg-blue-500/80">
            Continue to Identity Verification
          </Button>
        </div>
      </form>
    </Form>
  );
}
