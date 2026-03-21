import type { Metadata } from "next";
import { LoginForm } from "./components";

export const metadata: Metadata = {
	title: "Login | Dummy App",
	description: "Login to your account to continue.",
};

export default function LoginPage() {
	return (
		<section className="flex w-full flex-col items-center justify-center gap-6 bg-white p-8">
			<div className="flex flex-col items-center gap-2">
				<h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
				<p className="text-sm text-muted-foreground">Sign in to your account</p>
			</div>
			<LoginForm />
		</section>
	);
}
