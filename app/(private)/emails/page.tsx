import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import EmailTable from "./components/email-table";

const EmailsPage = async () => {
	const { data, totalPages, totalCount } = await fetchEmails();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col gap-4 overflow-auto p-5">
			<div>
				<h1 className="text-2xl font-bold">Emails</h1>
				<p className="text-muted-foreground text-sm">AI-classified procurement emails — RFQs, POs, reminders, and more</p>
			</div>
			<EmailTable initialData={data} initialTotalCount={totalCount} initialTotalPages={totalPages} />
		</section>
	);
};

export default EmailsPage;

const fetchEmails = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/email/all?page=1&size=20&sortBy=date&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as EmailRecord[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as EmailRecord[], totalPages: 0, totalCount: 0 };
	}
};
