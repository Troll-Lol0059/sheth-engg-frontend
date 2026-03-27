import React from "react";
import Image from "next/image";
import { logo } from "@assets";

interface AuthLayoutProps {
	children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
	return (
		<main className="flex min-h-screen w-full flex-row justify-between">
			<div className="hidden h-screen w-[30%] items-center justify-center bg-primary/10 md:flex">
				<div className="flex flex-col items-center gap-4 px-8 text-center">
					<Image alt="Sheth Engineering" src={logo} width={200} height={48} priority />
					<p className="text-sm text-muted-foreground">AI-Powered RFQ Management & Costing Platform.</p>
				</div>
			</div>
			<div className="flex w-full flex-row items-center justify-center bg-background md:w-[70%]">{children}</div>
		</main>
	);
};

export default AuthLayout;
