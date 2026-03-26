import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { AuditLogTable, AuditLogStats, auditLogColumns } from "./components";

const AuditLogsPage = async () => {
	const { data, totalPages, totalCount } = await fetchAuditLogs();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-4 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Audit Logs & System Health</h1>
					<p className="text-muted-foreground text-sm">
						Monitor all system activity, errors, and uptime status
					</p>
				</div>
			</div>

			{/* Stats Dashboard */}
			<div className="w-full">
				<AuditLogStats />
			</div>

			{/* Audit Logs Table */}
			<div className="w-full">
				<h2 className="mb-3 text-lg font-semibold">Activity Log</h2>
				<AuditLogTable
					columns={auditLogColumns}
					initialData={data}
					totalElements={totalCount}
					totalPages={totalPages}
				/>
			</div>
		</section>
	);
};

export default AuditLogsPage;

const fetchAuditLogs = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/audit-logs?page=1&size=20&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as AuditLog[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.total ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as AuditLog[], totalPages: 0, totalCount: 0 };
	}
};
