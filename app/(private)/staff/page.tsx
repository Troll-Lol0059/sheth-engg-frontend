import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { StaffTable, AddStaffDialog } from "./components";
import { staffColumns } from "./components/staff-columns";
import ModuleHelp from "@components/common/module-help";
import { staffHelp } from "@data/helpData";

const StaffPage = async () => {
	const { data, totalPages, totalCount } = await fetchStaff();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Staff Management</h1>
					<p className="text-muted-foreground text-sm">Create, manage, and remove staff members</p>
				</div>
				<div className="flex gap-2">
				<ModuleHelp description="Guide to managing staff members" sections={staffHelp} title="Staff Management — Help" />
				<AddStaffDialog />
			</div>
			</div>
			<StaffTable columns={staffColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default StaffPage;

const fetchStaff = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/staff?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as Staff[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.total ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as Staff[], totalPages: 0, totalCount: 0 };
	}
};
