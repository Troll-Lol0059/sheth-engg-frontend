import type { Metadata } from "next";
import { RegisterForm } from "./components";
import axios from "@config/axios";
import { handleAxiosError } from "@utils/errorHandling";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Register | Cyber Essentials",
	description: "Create your Cyber Essentials account and start your 14-day free trial.",
};

export default async function RegisterPage() {
	const countries = await getAllCountries();

	return (
		<section className="flex w-full flex-col gap-12 md:p-8 p-5 md:w-3/4" >
			<RegisterForm countries={countries} />

			<div className="text-center flex flex-col md:flex-row md:justify-center gap-2">
				<p>Already have an account? </p>
				<Link href={`${process.env.NEXT_PUBLIC_URL}/auth/login`}>
					<span className="cursor-pointer font-bold text-primary">Login Here</span>
				</Link>
			</div>
		</section >
	);
}

export const getAllCountries = async () => {
	try {
		const response = await axios.get("/common/public/countries");
		return response?.data as Country[];
	} catch (error: unknown) {
		return handleAxiosError<Country>(error);
	}
};
