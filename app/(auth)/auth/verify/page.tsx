import type { Metadata } from "next";
import Image from "next/image";
import { logo } from "@assets";
import { VerifyForm } from "./components";

export const metadata: Metadata = {
	title: "Verify",
	description: "Verify your Sheth Engineering account to continue.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email: string; type: string }> }) {
	const { email, type } = await searchParams;
	return (
		<section className="flex w-full flex-col items-center justify-center bg-white">
			<Image alt="Sheth Engineering" src={logo} width={200} height={48} priority />
			<VerifyForm email={email} type={type} />
		</section>
	);
}
