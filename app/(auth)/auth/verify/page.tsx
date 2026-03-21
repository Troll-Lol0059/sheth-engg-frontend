import type { Metadata } from "next";
import { VerifyForm } from "./components";
import { logo } from "@assets";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Verify | Cyber Essentials",
    description: "Verify your Cyber Essentials account to continue.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email: string; type: string }> }) {
    const { email, type } = await searchParams;
    return (
        <section className="w-full flex flex-col items-center justify-center bg-white">
            <Image alt="Logo" src={logo} width={150} height={150} />
            <VerifyForm email={email} type={type} />
        </section>
    );
}