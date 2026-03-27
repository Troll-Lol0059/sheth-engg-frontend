import Image from "next/image";
import { Metadata } from "next";
import { isEmail } from "validator";
import { logo } from "@assets";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "./components";
import { APP_DESCRIPTION, APP_NAME } from "@data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
	title: "Reset Password",
	description: APP_DESCRIPTION,
};

type ResetPasswordPageProps = {
	searchParams: Promise<{
		email: string;
		token: string;
	}>;
};

const ResetPasswordPage = async (props: ResetPasswordPageProps) => {
	const searchParams = await props.searchParams;
	if (!isEmail(searchParams?.email ?? "") || !searchParams?.token) {
		notFound();
	} else {
		return (
			<main className="relative flex min-h-screen w-full flex-col items-center justify-center">
				<section className="bg-gradient-logo absolute inset-x-0 top-0 h-1/3 w-full" />
				<Card className="xs:px-6 z-10 m-5 max-w-lg">
					<CardHeader className="text-center">
						<div className="mb-4 flex justify-center">
							<Image alt={APP_NAME} priority src={logo} width={200} height={48} />
						</div>
						<CardTitle>Reset Password</CardTitle>
						<CardDescription>Change your password to enhance security and access your {APP_NAME} account.</CardDescription>
					</CardHeader>
					<CardContent>
						<ResetPasswordForm token={searchParams?.token} />
					</CardContent>
				</Card>
			</main>
		);
	}
};
export default ResetPasswordPage;
