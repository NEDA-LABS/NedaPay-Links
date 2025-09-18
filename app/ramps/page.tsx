"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArrowRight, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { withDashboardLayout } from "@/utils/withDashboardLayout";
import Header from "@/components/Header";

interface Country {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  route: string;
}

const countries: Country[] = [
  {
    id: "tanzania",
    name: "Tanzania",
    currency: "Tanzanian Shilling",
    currencySymbol: "TZS",
    flag: "🇹🇿",
    route: "/ramps/payramp",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    currency: "Indonesian Rupiah",
    currencySymbol: "IDR",
    flag: "🇮🇩",
    route: "/ramps/idrxco",
  },
  {
    id: "nigeria",
    name: "Nigeria",
    currency: "Nigerian Naira",
    currencySymbol: "NGN",
    flag: "🇳🇬",
    route: "/ramps/payramp",
  },
  {
    id: "kenya",
    name: "Kenya",
    currency: "Kenyan Shilling",
    currencySymbol: "KES",
    flag: "🇰🇪",
    route: "/ramps/payramp",
  },
  {
    id: "uganda",
    name: "Uganda",
    currency: "Ugandan Shilling",
    currencySymbol: "UGX",
    flag: "🇺🇬",
    route: "/ramps/payramp",
  },
];

function RampsPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const handleCountrySelect = (countryId: string) => {
    setSelectedCountry(countryId);
    setOpen(false);
  };

  const handleProceed = () => {
    if (!selectedCountry) return;

    const country = countries.find((c) => c.id === selectedCountry);
    if (!country) return;

    setIsProcessing(true);
    setTimeout(() => {
      router.push(country.route);
    }, 500);
  };

  const selectedCountryData = countries.find((c) => c.id === selectedCountry);

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Single Card with Form */}
          <Card className="bg-slate-800 border border-slate-700 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                {/* <Search className="h-5 w-5 text-indigo-400" /> */}
                Withdrawal Destination/Currency
              </CardTitle>
              {/* <CardDescription className="text-slate-300">
              Search and select your country for cryptocurrency withdrawal
            </CardDescription> */}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Country Selection with Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-300">
                  Select Country
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full py-6 rounded-lg bg-slate-200 border border-indigo-700 text-slate-800 justify-between hover:bg-slate-300"
                    >
                      {selectedCountry ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {selectedCountryData?.flag}
                          </span>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {selectedCountryData?.name}
                            </span>
                            <span className="text-xs text-slate-600">
                              {selectedCountryData?.currency} (
                              {selectedCountryData?.currencySymbol})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">
                          Select your country/currency...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-slate-200 border border-indigo-700">
                    <Command className="bg-slate-200">
                      <CommandInput
                        placeholder="Search countries..."
                        className="bg-slate-100 border-slate-300 text-slate-800"
                      />
                      <CommandEmpty className="text-slate-600 p-4">
                        No country found.
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-auto">
                        {countries.map((country) => (
                          <CommandItem
                            key={country.id}
                            value={`${country.name} ${country.currency} ${country.currencySymbol}`}
                            onSelect={() => handleCountrySelect(country.id)}
                            className="cursor-pointer hover:bg-slate-300 text-slate-800"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <span className="text-lg">{country.flag}</span>
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">
                                  {country.name}
                                </span>
                                <span className="text-xs text-slate-600">
                                  {country.currency} ({country.currencySymbol})
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedCountry === country.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Country Preview */}
              {selectedCountryData && (
                <div className="p-4 rounded-lg bg-slate-700 border border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {selectedCountryData.flag}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          {selectedCountryData.name}
                        </h3>
                        <p className="text-sm text-slate-300">
                          {selectedCountryData.currency}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-800 text-indigo-100 border border-indigo-600"
                    >
                      {selectedCountryData.currencySymbol}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Proceed Button */}
              <Button
                onClick={handleProceed}
                disabled={!selectedCountry || isProcessing}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Redirecting...</span>
                ) : (
                  <>
                    <span>Proceed to Withdrawal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default withDashboardLayout(RampsPage);
