import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BarcodeStatusTable from "./components/barcode-status-table";

const BarcodesPage = async () => {
	const { data, totalPages, totalCount } = await fetchInitialData();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<Link href="/sales" className="text-muted-foreground mb-2 flex items-center gap-1 text-sm hover:underline">
					<ArrowLeft size={14} />
					Back to Sales
				</Link>
				<h1 className="text-2xl font-bold">Manage Barcodes</h1>
				<p className="text-muted-foreground text-sm">JSW VSC barcode number per invoice — used for payment-reconciliation follow-ups</p>
			</div>
			<BarcodeStatusTable initialData={data} initialTotalPages={totalPages} initialTotalCount={totalCount} />
		</div>
	);
};

export default BarcodesPage;

const fetchInitialData = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	try {
		const response = await axios.get("/api/v1/sales/barcodes?page=1&size=20", { headers });
		const result = response?.data?.data;
		return {
			data: (result?.data ?? []) as BarcodeStatusRow[],
			totalPages: (result?.totalPages ?? 0) as number,
			totalCount: (result?.total ?? 0) as number,
		};
	} catch {
		return { data: [] as BarcodeStatusRow[], totalPages: 0, totalCount: 0 };
	}
};
