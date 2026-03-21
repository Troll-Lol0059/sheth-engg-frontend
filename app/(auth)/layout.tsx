import React from "react";

interface AuthLayoutProps {
	children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
	return (
		<main className="flex min-h-screen w-full flex-row justify-between">
			<div className="hidden h-screen w-[30%] items-center justify-center bg-primary/10 md:flex">
				<div className="flex flex-col items-center gap-4 px-8 text-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">D</div>
					<h2 className="text-2xl font-bold text-primary">Dummy App</h2>
					<p className="text-sm text-muted-foreground">Manage your RFQs and documents with ease.</p>
				</div>
			</div>
			<div className="flex w-full flex-row items-center justify-center bg-background md:w-[70%]">{children}</div>
		</main>
	);
};

export default AuthLayout;
