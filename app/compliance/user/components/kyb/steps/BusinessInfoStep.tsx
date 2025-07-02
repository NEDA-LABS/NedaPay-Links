
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { BusinessInfo, BusinessType } from '../../../types/kyc';
import { Building, MapPin, Globe, Calendar } from 'lucide-react';

const businessInfoSchema = z.object({
  legalName: z.string().min(2, 'Legal business name is required'),
  tradingName: z.string().optional(),
  registrationNumber: z.string().min(1, 'Business registration number is required'),
  incorporationDate: z.string().min(1, 'Date of incorporation is required'),
  businessType: z.nativeEnum(BusinessType),
  industry: z.string().min(1, 'Industry is required'),
  description: z.string().min(10, 'Business description must be at least 10 characters'),
  website: z.string().url().optional().or(z.literal('')),
  address: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    postalCode: z.string().min(4, 'Valid postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  registeredAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State/Province is required'),
    postalCode: z.string().min(4, 'Valid postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  sameAsBusinessAddress: z.boolean().optional(),
});

interface BusinessInfoStepProps {
  onNext: (data: BusinessInfo) => void;
  initialData?: Partial<BusinessInfo>;
}

const BUSINESS_TYPES = [
  { value: BusinessType.LLC, label: 'Limited Liability Company (LLC)' },
  { value: BusinessType.CORPORATION, label: 'Corporation' },
  { value: BusinessType.PARTNERSHIP, label: 'Partnership' },
  { value: BusinessType.SOLE_PROPRIETORSHIP, label: 'Sole Proprietorship' },
  { value: BusinessType.NON_PROFIT, label: 'Non-Profit Organization' },
  { value: BusinessType.TRUST, label: 'Trust' },
];

const INDUSTRIES = [
  'Technology', 'Financial Services', 'Healthcare', 'E-commerce', 'Manufacturing',
  'Real Estate', 'Education', 'Legal Services', 'Consulting', 'Media & Entertainment',
  'Retail', 'Transportation', 'Energy', 'Agriculture', 'Other'
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Japan', 'Australia', 'Singapore', 'Switzerland', 'Other'
];

export function BusinessInfoStep({ onNext, initialData }: BusinessInfoStepProps) {
  const form = useForm<BusinessInfo & { sameAsBusinessAddress?: boolean }>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      legalName: initialData?.legalName || '',
      tradingName: initialData?.tradingName || '',
      registrationNumber: initialData?.registrationNumber || '',
      incorporationDate: initialData?.incorporationDate || '',
      businessType: initialData?.businessType || BusinessType.LLC,
      industry: initialData?.industry || '',
      description: initialData?.description || '',
      website: initialData?.website || '',
      address: {
        street: initialData?.address?.street || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        postalCode: initialData?.address?.postalCode || '',
        country: initialData?.address?.country || '',
      },
      registeredAddress: {
        street: initialData?.registeredAddress?.street || '',
        city: initialData?.registeredAddress?.city || '',
        state: initialData?.registeredAddress?.state || '',
        postalCode: initialData?.registeredAddress?.postalCode || '',
        country: initialData?.registeredAddress?.country || '',
      },
      sameAsBusinessAddress: false,
    },
  });

  const watchSameAddress = form.watch('sameAsBusinessAddress');

  const onSubmit = (data: BusinessInfo & { sameAsBusinessAddress?: boolean }) => {
    const businessData: BusinessInfo = {
      legalName: data.legalName,
      tradingName: data.tradingName,
      registrationNumber: data.registrationNumber,
      incorporationDate: data.incorporationDate,
      businessType: data.businessType,
      industry: data.industry,
      description: data.description,
      website: data.website,
      address: data.address,
      registeredAddress: data.sameAsBusinessAddress ? data.address : data.registeredAddress,
    };

    onNext(businessData);
  };

  const copyBusinessAddress = (checked: boolean) => {
    if (checked) {
      const businessAddress = form.getValues('address');
      form.setValue('registeredAddress', businessAddress);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter legal business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tradingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trading Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter trading name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter registration number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incorporationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Incorporation *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry/Sector *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
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
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your business activities, products, and services"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Business Address
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

        {/* Registered Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Registered Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAddress"
                checked={watchSameAddress}
                onCheckedChange={(checked: any) => {
                  form.setValue('sameAsBusinessAddress', checked as boolean);
                  copyBusinessAddress(checked as boolean);
                }}
              />
              <label
                htmlFor="sameAddress"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Same as business address
              </label>
            </div>

            {!watchSameAddress && (
              <>
                <FormField
                  control={form.control}
                  name="registeredAddress.street"
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
                    name="registeredAddress.city"
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
                    name="registeredAddress.state"
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
                    name="registeredAddress.postalCode"
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
                    name="registeredAddress.country"
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
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="px-8">
            Continue to Business Documents
          </Button>
        </div>
      </form>
    </Form>
  );
}
