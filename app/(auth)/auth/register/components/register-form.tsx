"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import axios from "@/config/axios";
import { logo } from "@assets";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toaster";
import usePasswordToggle from "@/hooks/usePasswordToggle";
import { RegistrationSchema } from "@/schemas";
import { PhoneInput } from "@components/ui/phone-input";
import { encrypt } from "@config/encryption";
import { ArrowLeft, Compass, ContactRound, Earth, LocateFixed, Mail, Map, MapPinned, Navigation, UserPlus } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@components/ui/select";

interface RegisterFormProps {
    countries: Country[];
}

const RegisterForm = ({ countries }: RegisterFormProps) => {
    const router = useRouter();
    const [loadingToastId, setLoadingToastId] = useState<string | number>();
    const { inputIcon: pwdInputIcon, inputType: pwdInputType } = usePasswordToggle();
    const { inputIcon: cPwdInputIcon, inputType: cPwdInputType } = usePasswordToggle();

    const defaultValues: z.infer<typeof RegistrationSchema> = {
        firstName: "",
        lastName: "",
        middleName: "",
        email: "",
        password: "",
        confirmPassword: "",
        contactNo: "",
        address: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            province: "",
            countryUuid: "",
            zipCode: "",
        },
        agreeToTerms: false,
    };

    const form = useForm<z.infer<typeof RegistrationSchema>>({
        defaultValues,
        mode: "onTouched",
        resolver: zodResolver(RegistrationSchema),
    });

    const registerUser = async (data: z.infer<typeof RegistrationSchema>) => {
        setLoadingToastId(toast.loading("Loading...", { description: "Please wait while we create your account!" }));
        const password = encrypt(data?.password);
        const payload = {
            firstName: data?.firstName,
            lastName: data?.lastName,
            middleName: data?.middleName ?? "",
            email: data?.email,
            password: password,
            contactNo: data?.contactNo,
            address: data?.address,
        };
        const response = await axios.post("/client-profile/register", payload);
        return response.data;
    };

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            toast.success("Success!", {
                id: loadingToastId,
                description: "Registration completed successfully! Please check your email for verification code.",
            });
            router.replace(`/auth/verify?email=${encodeURIComponent(form.getValues("email"))}&type=ACTIVATION`);
        },
        onError: (error: unknown) => {
            const errorData = (error as AxiosError)?.response?.data as ErrorData;
            toast.error("Error!", {
                id: loadingToastId,
                description:
                    errorData?.message ??
                    (error as AxiosError)?.response?.statusText ??
                    "Registration failed. Please try again.",
            });
        },
    });

    return (
        <section className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
            {/* Back Button */}
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Link>

            {/* Logo */}
            <div className="flex flex-row items-center justify-center">
                <Image src={logo} alt="Logo" width={150} height={150} />
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))}
                    className="flex flex-col md:grid md:grid-cols-2 gap-6 w-full"
                >
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    First Name <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your first name"
                                        startContent={<ContactRound />}
                                        {...field}
                                    />
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
                                <FormLabel>Middle Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your middle name"
                                        startContent={<ContactRound />}
                                        {...field}
                                    />
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
                                <FormLabel>
                                    Last name <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your last name"
                                        startContent={<ContactRound />}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">
                                    Email <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        startContent={<Mail className="w-4 h-4" />}
                                        placeholder="Enter your email address"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">
                                    Create Password <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type={pwdInputType}
                                        placeholder="Enter a strong password"
                                        endContent={pwdInputIcon}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">
                                    Confirm Password <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type={cPwdInputType}
                                        placeholder="Confirm your password"
                                        endContent={cPwdInputIcon}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contactNo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Contact No. <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <PhoneInput placeholder="Enter your contact no. with country code" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.addressLine1"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Address Line 1 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter address" startContent={<Compass />} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.addressLine2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address Line 2</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter address" startContent={<Navigation />} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    City <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter city" startContent={<MapPinned />} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.province"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Province</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter province" startContent={<Map />} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.countryUuid"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Country <span className="text-destructive">*</span>
                                </FormLabel>
                                <Select name="countryUuid" defaultValue={field.value} onValueChange={field.onChange} key={form.watch("address.countryUuid")}>
                                    <FormControl>
                                        <SelectTrigger startContent={<Earth />}>
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{countries?.length ? "Country" : "No Countries!"}</SelectLabel>
                                            {countries?.map((country: Country) => (
                                                <SelectItem value={country?.uuid} key={country?.uuid}>
                                                    <div className="flex items-center gap-2">
                                                        <Image alt={country?.countryCode} height={15} src={`https://flagcdn.com/20x15/${country.countryCode}.png`} width={20} />
                                                        {country?.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address.zipCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    ZIP Code <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter zip code" startContent={<LocateFixed />} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked)}
                                        />
                                    </FormControl>
                                    <FormLabel>
                                        By ticking the box, I provide consent to Baseel Partners to process my
                                        personal information <span className="text-destructive">*</span>
                                    </FormLabel>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="col-span-2 w-full space-y-4 pt-4">
                        <Button
                            type="submit"
                            variant="default"
                            className="w-full h-12 cursor-pointer"
                            disabled={registerMutation.isPending}
                        >
                            <UserPlus />
                            Register
                        </Button>
                    </div>
                </form>
            </Form>
        </section>
    );
};

export { RegisterForm };
