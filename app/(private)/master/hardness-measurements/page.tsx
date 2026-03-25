import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import { AxiosError } from "axios";
import { HardnessMeasurementTable, AddHardnessMeasurementDialog } from "./components";
import { hardnessMeasurementColumns } from "./components/hardness-measurement-columns";
import ModuleHelp from "@components/common/module-help";
import { hardnessMeasurementsHelp } from "@data/helpData";

const HardnessMeasurementsPage = async () => {
	const { data, totalPages, totalCount } = await fetchHardnessMeasurements();

	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col items-center gap-2 overflow-auto p-5">
			<div className="flex w-full items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Hardness Measurements</h1>
					<p className="text-sm text-muted-foreground">Manage hardness measurement unit definitions</p>
				</div>
				<div className="flex gap-2">
				<ModuleHelp description="Guide to managing hardness measurements" sections={hardnessMeasurementsHelp} title="Hardness Measurements — Help" />
				<AddHardnessMeasurementDialog />
			</div>
			</div>
			<HardnessMeasurementTable columns={hardnessMeasurementColumns} initialData={data} totalElements={totalCount} totalPages={totalPages} />
		</section>
	);
};

export default HardnessMeasurementsPage;

const fetchHardnessMeasurements = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	try {
		const response = await axios.get("/api/v1/master/hardness-measurement/all?page=1&size=10&sortBy=createdAt&sortOrder=desc", {
			headers: { cookie: `accessToken=${token}; refreshToken=${refreshToken}` },
		});
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as HardnessMeasurement[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.totalCount ?? 0) as number,
		};
	} catch (error: unknown) {
		const errorData = (error as AxiosError)?.response?.data as ErrorData;
		console.error(errorData?.message);
		return { data: [] as HardnessMeasurement[], totalPages: 0, totalCount: 0 };
	}
};
