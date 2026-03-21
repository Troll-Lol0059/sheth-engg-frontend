import type { Metadata } from "next";
import Image from "next/image";
import { logo } from "@assets";
import ForgotPasswordForm from "./components/forget-password";

export const metadata: Metadata = {
    title: "Forgot Password | Cyber Essentials",
    description: "Forgot your Cyber Essentials password? Reset it here.",
};

export default async function ForgotPasswordPage() {
    return (
        <section className="w-full flex flex-col items-center justify-center bg-white">
            <Image alt="Logo" src={logo} width={150} height={150} />
            <ForgotPasswordForm />
        </section>
    );
}