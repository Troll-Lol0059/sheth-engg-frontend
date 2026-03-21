"use client";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@components/ui/input";
import { LoginSchema } from "@/schemas";
import { Button } from "@components/ui/button";
import { toast } from "@components/ui/toaster";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LogIn, Mail } from "lucide-react";
import usePasswordToggle from "@hooks/usePasswordToggle";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";
import useSession from "@store/session";

const LoginForm = () => {
	const router = useRouter();
	const { setSession } = useSession();
	const { inputIcon, inputType } = usePasswordToggle();
	const [onLoginToast, setOnLoginToast] = useState<string | number>();

	const defaultValues: z.infer<typeof LoginSchema> = {
		email: "",
		password: "",
	};

	const form = useForm<z.infer<typeof LoginSchema>>({
		defaultValues: defaultValues,
		mode: "onTouched",
		resolver: zodResolver(LoginSchema),
	});

	const onLogin = async (values: z.infer<typeof LoginSchema>) => {
		setOnLoginToast(toast.loading("Loading...", { description: "Please wait while we log you in!" }));
		const { email, password } = values;
		const response = await axios.post("/api/v1/user/login", { email, password });
		return response?.data;
	};

	const { mutate, isPending } = useMutation({
		mutationFn: onLogin,
		onSuccess: async (data) => {
			// --- 2FA flow commented out ---
			// if (data?.data?.is2faEnabled === true) {
			// 	toast.info("2FA Enabled!", {
			// 		id: onLoginToast,
			// 		description: "Verify OTP to continue login",
			// 	});
			// 	sessionStorage.setItem(
			// 		"2fa_login_payload",
			// 		JSON.stringify({
			// 			email: form.getValues("email"),
			// 			password: form.getValues("password"),
			// 		})
			// 	);
			// 	router.replace(`/auth/verify?type=LOGIN`);
			// 	return;
			// }
			// --- end 2FA ---

			toast.success("Success!", { id: onLoginToast, description: "You've successfully logged in!" });

			const user = data?.data?.user;
			setSession({
				uuid: user?._id ?? null,
				avatarUrl: null,
				name: user?.userName ?? user?.firstName ?? null,
				email: user?.email ?? null,
				contactNo: user?.phoneNumber ?? null,
				roles: user?.role ? [user.role] : [],
			});

			router.replace("/RFQ");
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			const errorTitle = errorData?.error ?? "Error!";
			toast.error(errorTitle, {
				id: onLoginToast,
				description: errorData?.message ?? (error as AxiosError)?.response?.statusText ?? "An error occurred while logging in!",
			});
		},
	});

	return (
		<Form {...form}>
			<form className="flex w-full max-w-md flex-col items-center justify-center gap-2" onSubmit={form.handleSubmit(values => mutate(values))}>
				<div className="flex w-full flex-col items-center justify-center gap-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>
									Email <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="Enter your email" startContent={<Mail />} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormLabel>
									Password <span className="text-destructive">*</span>
								</FormLabel>
								<FormControl>
									<Input endContent={inputIcon} placeholder="Enter your password" startContent={<LockKeyhole />} type={inputType} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<Link className="w-full text-end text-xs font-medium text-primary md:text-sm" href="/auth/forgot-password">
					Forgot Password?
				</Link>
				<div className="flex w-full flex-col items-center justify-center gap-6">
					<Button className="w-36 cursor-pointer" disabled={isPending} size="lg" type="submit" variant="default">
						<LogIn />
						Login
					</Button>
					<span className="text-xs md:text-sm">
						{`Don't have an account? `}
						<Link className="text-xs font-medium text-primary md:text-sm" href="/auth/register">
							REGISTER NOW
						</Link>
					</span>
				</div>
			</form>
		</Form>
	);
};

export default LoginForm;
