"use client";
import { z } from "zod";
import axios from "@config/axios";
import { AxiosError } from "axios";
import useSession from "@store/session";
import { useForm } from "react-hook-form";
import useCounter from "@hooks/useCounter";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { toast } from "@components/ui/toaster";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerificationSchema } from "@/schemas";
import { ArrowLeft, RefreshCcw, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@components/ui/input-otp";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@components/ui/form";
import { useEffect, useState } from "react";
type VerifyFormProps = {
    email: string;
    type: string;
    password?: string;
};

const VerifyForm = ({ email, type }: VerifyFormProps) => {
    const router = useRouter();
    const [loginPayload, setLoginPayload] = useState<{ email: string; password: string } | null>(null);

    useEffect(() => {
        if (type === "LOGIN") {
            const stored = sessionStorage.getItem("2fa_login_payload");
            if (!stored) {
                router.replace("/auth/login");
                return;
            }
            setLoginPayload(JSON.parse(stored));
        }
    }, [type, router]);
    const { setSession } = useSession();
    const { counter, startCounter } = useCounter(59);
    const [onResendToast] = useState<string | number>();
    const [onLoginToast, setOnLoginToast] = useState<string | number>();
    const [onVerifyToast, setOnVerifyToast] = useState<string | number>();

    const defaultValues: z.infer<typeof VerificationSchema> = {
        otp: "",
    };
    const form = useForm<z.infer<typeof VerificationSchema>>({
        defaultValues: defaultValues,
        mode: "onTouched",
        resolver: zodResolver(VerificationSchema),
    });

    const onResend = async () => {
        startCounter(59);
        try {
            await axios.post("/otp/request-otp", { email });
            toast.success("Success!", { id: onResendToast, description: "OTP successfully sent to your email!" });
        } catch (error: unknown) {
            toast.error("Error!", {
                id: onResendToast,
                description: ((error as AxiosError)?.response?.data as string) ?? "An error occurred!",
            });
        }
    };

    const onVerify = async (values: z.infer<typeof VerificationSchema>) => {
        setOnVerifyToast(toast.loading("Loading...", { description: "Please wait while we verify the OTP!" }));
        const { otp } = values;
        await axios.post("/otp/verify-email", { email, otp, type });
    };

    const on2FALogin = async (values: z.infer<typeof VerificationSchema>) => {
        setOnLoginToast(
            toast.loading("Loading...", {
                description: "Please wait while we verify the OTP!",
            })
        );
        const { otp } = values;
        const response = await axios.post("/auth/validate-authentication", {
            email: loginPayload?.email,
            password: loginPayload?.password,
            otp,
        });
        return response?.data;
    };

    const { mutate, isPending } = useMutation({
        mutationFn: type === "LOGIN" ? on2FALogin : onVerify,
        onSuccess: (data: AuthSession, values: z.infer<typeof VerificationSchema>) => {
            const { otp } = values;
            if (type === "LOGIN") {
                sessionStorage.removeItem("2fa_login_payload");
                setSession(data);
                toast.success("Success!", { id: onLoginToast, description: "You've successfully logged in!" });
                router.replace("/profile");
            } else if (type === "REGISTER") {
                toast.success("Success", { id: onVerifyToast, description: "Account created successfully!" });
                router.replace("/auth/login");
            } else if (type === "ACTIVATION") {
                toast.success("Success!", { id: onVerifyToast, description: "OTP verified successfully!" });
                router.replace("/auth/login");
            } else {
                toast.success("Success!", { id: onVerifyToast, description: "OTP sent successfully!" });
                router.replace(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
            }
        },
        onError: (error: unknown) => {
            const errorData = (error as AxiosError)?.response?.data as ErrorData;
            const errorTitle = errorData?.error ?? "Error!";
            if (type === "LOGIN") {
                toast.error(errorTitle, { id: onLoginToast, description: errorData?.message ?? "An error occurred!" });
            } else {
                toast.error(errorTitle, { id: onVerifyToast, description: errorData?.message ?? "An error occurred!" });
            }
        },
    });

    return (
        <Form {...form}>
            <form
                className="flex w-full max-w-md flex-col items-center justify-stretch gap-3 px-4 sm:gap-4 md:gap-6 md:px-0"
                onSubmit={form.handleSubmit((values) => mutate(values))}
            >
                <FormField
                    control={form.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormControl>
                                <InputOTP
                                    className="flex w-full justify-center"
                                    containerClassName="gap-1 sm:gap-2 md:gap-3"
                                    maxLength={6}
                                    {...field}
                                >
                                    {Array.from({ length: 6 }, (_, index) => (
                                        <InputOTPGroup key={`otp-slot-${index}`}>
                                            <InputOTPSlot
                                                index={index}
                                                className="h-8 w-8 text-xs sm:h-10 sm:w-10 md:h-14 md:w-14 md:text-base"
                                            />
                                        </InputOTPGroup>
                                    ))}
                                </InputOTP>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex w-full flex-col items-center justify-between gap-3 md:gap-4">
                    <Button
                        className="border-rounded h-8 w-1/2 cursor-pointer rounded-full font-medium"
                        disabled={isPending}
                        size="lg"
                        type="submit"
                        variant="default"
                    >
                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                        Verify
                    </Button>
                    {counter > 0 ? (
                        <p className="flex h-10 w-full items-center justify-center px-2 text-center text-xs sm:h-12 sm:px-4 sm:text-sm md:text-base">{`Resend OTP in ${counter} seconds`}</p>
                    ) : (
                        <Button
                            className="w-full max-w-[180px] cursor-pointer gap-2"
                            disabled={isPending}
                            onClick={onResend}
                            size="lg"
                            type="button"
                            variant="ghost"
                        >
                            <RefreshCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                            Resend OTP
                        </Button>
						
                    )}
                    <Button
                        className="w-36 cursor-pointer"
                        disabled={isPending}
                        onClick={router.back}
                        size="sm"
                        type="button"
                        variant="ghost"
                    >
                        <ArrowLeft />
                        Back
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default VerifyForm;
