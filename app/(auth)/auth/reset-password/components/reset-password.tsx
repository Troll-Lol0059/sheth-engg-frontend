"use client";
import { z } from "zod";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@components/ui/input";

import { Button } from "@components/ui/button";
import { toast } from "@components/ui/toaster";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import usePasswordToggle from "@hooks/usePasswordToggle";
import { LockKeyhole, RefreshCcwDot } from "lucide-react";
import { ResetPasswordSchema } from "@/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";

type ResetPasswordFormProps = {
	token: string;
};

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
	const router = useRouter();
	const [onResetToast, setOnResetToast] = useState<string | number>();
	const { inputIcon: pwdInputIcon, inputType: pwdInputType } = usePasswordToggle();
	const { inputIcon: cPwdInputIcon, inputType: cPwdInputType } = usePasswordToggle();

	const defaultValues: z.infer<typeof ResetPasswordSchema> = {
		newPassword: "",
		confirmPassword: "",
	};

	const form = useForm<z.infer<typeof ResetPasswordSchema>>({
		defaultValues: defaultValues,
		mode: "onTouched",
		resolver: zodResolver(ResetPasswordSchema),
	});

	const onReset = async (values: z.infer<typeof ResetPasswordSchema>) => {
		setOnResetToast(toast.loading("Loading...", { description: "Please wait while we reset your password!" }));
		const payload = {
			token,
			newPassword: values?.newPassword,
		};
		const response = await axios.post("/api/v1/user/reset-password", payload);
		return response?.data;
	};

	const { mutate, isPending } = useMutation({
		mutationFn: onReset,
		onSuccess: data => {
			toast.success("Success!", { id: onResetToast, description: data?.message ?? "You've successfully reset your password!" });
			router.replace("/auth/login");
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			const errorTitle = errorData?.error ?? "Error!";
			toast.error(errorTitle, { id: onResetToast, description: errorData?.message ?? (error as AxiosError)?.response?.statusText ?? "An error occurred!" });
		},
	});

	return (
		<Form {...form}>
			<form className="flex w-full flex-col items-center justify-stretch gap-4" onSubmit={form.handleSubmit(values => mutate(values))}>
				<FormField
					control={form.control}
					name="newPassword"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>
								New Password <span className="text-destructive">*</span>
							</FormLabel>
							<FormControl>
								<Input endContent={pwdInputIcon} placeholder="Enter your new password" startContent={<LockKeyhole />} type={pwdInputType} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="confirmPassword"
					render={({ field }) => (
						<FormItem className="w-full">
							<FormLabel>
								Confirm Password <span className="text-destructive">*</span>
							</FormLabel>
							<FormControl>
								<Input endContent={cPwdInputIcon} placeholder="Confirm your new password" startContent={<LockKeyhole />} type={cPwdInputType} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex w-full flex-col items-center justify-between gap-3">
					<Button className="w-36" disabled={isPending} size="lg" type="submit" variant="default">
						<RefreshCcwDot />
						Reset
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default ResetPasswordForm;
