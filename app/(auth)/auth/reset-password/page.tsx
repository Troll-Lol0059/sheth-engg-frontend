import Image from "next/image";
import { Metadata } from "next";
import { isEmail } from "validator";
import { authWarning } from "@assets";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "./components";
import { APP_DESCRIPTION, APP_NAME } from "@data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";

export const metadata: Metadata = {
	title: `${APP_NAME} | Reset Password`,
	description: APP_DESCRIPTION,
};

type ResetPasswordPageProps = {
	searchParams: Promise<{
		email: string;
		otp: string;
	}>;
};

const ResetPasswordPage = async (props: ResetPasswordPageProps) => {
    const searchParams = await props.searchParams;
    if (!isEmail(searchParams?.email ?? "") || searchParams?.otp?.length !== 6) {
		notFound();
	} else {
		return (
			<main className="relative flex min-h-screen w-full flex-col items-center justify-center">
				<section className="absolute inset-x-0 top-0 h-1/3 w-full bg-gradient-logo" />
				<Card className="z-10 m-5 max-w-lg xs:px-6">
					<CardHeader className="text-center">
						<div className="mb-4 flex justify-center">
							<Image alt="placeholder" priority src={authWarning} />
						</div>
						<CardTitle>{`Reset Password`}</CardTitle>
						<CardDescription>{`Easily change your password to enhance security and access personalized services on Impactors.`}</CardDescription>
					</CardHeader>
					<CardContent>
						<ResetPasswordForm email={searchParams?.email} otp={searchParams?.otp} />
					</CardContent>
				</Card>
			</main>
		);
	}
};
export default ResetPasswordPage;
