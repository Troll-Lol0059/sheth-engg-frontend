import type { Metadata } from "next";
import Image from "next/image";
import { logo } from "@assets";
import ForgotPasswordForm from "./components/forget-password";

export const metadata: Metadata = {
	title: "Forgot Password",
	description: "Forgot your Sheth Engineering password? Reset it here.",
};

export default async function ForgotPasswordPage() {
	return (
		<section className="flex w-full flex-col items-center justify-center bg-white">
			<Image alt="Sheth Engineering" src={logo} width={200} height={48} priority />
			<ForgotPasswordForm />
		</section>
	);
}
