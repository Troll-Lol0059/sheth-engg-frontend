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
import { ArrowLeft, Mail, Send } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPasswordSchema } from "@/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@components/ui/form";

const ForgotPasswordForm = () => {
	const router = useRouter();
	const [onSendToast, setOnSendToast] = useState<string | number>();

	const defaultValues: z.infer<typeof ForgotPasswordSchema> = {
		email: "",
	};

	const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
		defaultValues: defaultValues,
		mode: "onTouched",
		resolver: zodResolver(ForgotPasswordSchema),
	});

	const onSend = async (values: z.infer<typeof ForgotPasswordSchema>) => {
		setOnSendToast(toast.loading("Loading...", { description: "Please wait while we process your request!" }));
		const { email } = values;
		const response = await axios.post("/api/v1/user/forgot-password", { email });
		return { email, message: response?.data?.message };
	};

	const { mutate, isPending } = useMutation({
		mutationFn: onSend,
		onSuccess: data => {
			const { email, message } = data;
			toast.success("Success!", { id: onSendToast, description: message ?? "OTP sent to your email!" });
			router.push(`/auth/verify?email=${encodeURIComponent(email)}&type=FORGOT_PASSWORD`);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			const errorTitle = errorData?.error ?? "Error!";
			toast.error(errorTitle, { id: onSendToast, description: errorData?.message ?? (error as AxiosError)?.response?.statusText ?? "An error occurred!" });
		},
	});

	return (
		<Form {...form}>
			<form className="flex w-1/2 flex-col items-center justify-center gap-4" onSubmit={form.handleSubmit(values => mutate(values))}>
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
				<div className="flex w-full flex-col items-center justify-between gap-3">
					<Button className="w-36 cursor-pointer" disabled={isPending} size="lg" type="submit" variant="default">
						<Send />
						Send
					</Button>
					<Button className="w-36" disabled={isPending} onClick={router.back} size="lg" type="button" variant="ghost">
						<ArrowLeft />
						Back
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default ForgotPasswordForm;
