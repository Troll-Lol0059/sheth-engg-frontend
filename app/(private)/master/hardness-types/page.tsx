import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { HardnessTypeTable, AddHardnessTypeDialog } from "./components";
import { hardnessTypeColumns } from "./components/hardness-type-columns";

const HardnessTypesPage = async () => {
	const { data, totalPages, totalCount } = await fetchHardnessTypes();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Hardness Types</h1>
					<p className="text-sm text-muted-foreground">Manage hardness type definitions</p>
				</div>
				<AddHardnessTypeDialog />
			</div>
			<HardnessTypeTable columns={hardnessTypeColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default HardnessTypesPage;

const fetchHardnessTypes = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/master/hardness-type/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as HardnessType[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as HardnessType[], totalPages: 0, totalCount: 0 };
	}
};
