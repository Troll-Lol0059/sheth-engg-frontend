import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { LabourProcessTypeTable, AddLabourProcessTypeDialog } from "./components";
import { labourProcessTypeColumns } from "./components/labour-process-type-columns";
import ModuleHelp from "@components/common/module-help";
import { labourProcessTypesHelp } from "@data/helpData";

const LabourProcessTypesPage = async () => {
	const { data, totalPages, totalCount } = await fetchLabourProcessTypes();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Labour Process Types</h1>
					<p className="text-sm text-muted-foreground">Manage labour process type definitions</p>
				</div>
				<div className="flex gap-2">
				<ModuleHelp description="Guide to managing labour process types" sections={labourProcessTypesHelp} title="Labour Process Types — Help" />
				<AddLabourProcessTypeDialog />
			</div>
			</div>
			<LabourProcessTypeTable columns={labourProcessTypeColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default LabourProcessTypesPage;

const fetchLabourProcessTypes = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/master/labour-process-type/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as LabourProcessType[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as LabourProcessType[], totalPages: 0, totalCount: 0 };
	}
};
