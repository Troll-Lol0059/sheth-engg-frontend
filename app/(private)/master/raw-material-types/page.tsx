import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { RawMaterialTypeTable, AddRawMaterialTypeDialog } from "./components";
import { rawMaterialTypeColumns } from "./components/raw-material-type-columns";
import ModuleHelp from "@components/common/module-help";
import { rawMaterialTypesHelp } from "@data/helpData";

const RawMaterialTypesPage = async () => {
	const { data, totalPages, totalCount } = await fetchRawMaterialTypes();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Raw Material Types</h1>
					<p className="text-sm text-muted-foreground">Manage raw material type definitions</p>
				</div>
				<div className="flex gap-2">
				<ModuleHelp description="Guide to managing raw material types" sections={rawMaterialTypesHelp} title="Raw Material Types — Help" />
				<AddRawMaterialTypeDialog />
			</div>
			</div>
			<RawMaterialTypeTable columns={rawMaterialTypeColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default RawMaterialTypesPage;

const fetchRawMaterialTypes = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/master/raw-material-type/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as RawMaterialType[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as RawMaterialType[], totalPages: 0, totalCount: 0 };
	}
};
