import axios from "@config/axios";
import { getToken } from "@lib/getToken";
import { getRefreshToken } from "@lib/getRefreshToken";
import PaymentsPageClient from "./components/payments-page-client";

const PaymentsPage = async () => {
	const { advices, advicesTotalPages, advicesTotalCount, aging, agingTotalPages, agingTotalCount } = await fetchInitialData();

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Payments</h1>
				<p className="text-muted-foreground text-sm">Payment reconciliation — matched, short-paid, and unmatched advices, plus aging invoices</p>
			</div>
			<PaymentsPageClient
				initialAdvices={advices}
				initialAdvicesTotalPages={advicesTotalPages}
				initialAdvicesTotalCount={advicesTotalCount}
				initialAging={aging}
				initialAgingTotalPages={agingTotalPages}
				initialAgingTotalCount={agingTotalCount}
			/>
		</div>
	);
};

export default PaymentsPage;

const fetchInitialData = async () => {
	const token = await getToken();
	const refreshToken = await getRefreshToken();
	const headers = { cookie: `accessToken=${token}; refreshToken=${refreshToken}` };

	const [advicesResult, agingResult] = await Promise.allSettled([
		axios.get("/api/v1/payment/advices?page=1&size=10", { headers }),
		axios.get("/api/v1/payment/aging?page=1&size=10", { headers }),
	]);

	const advicesData = advicesResult.status === "fulfilled" ? (advicesResult.value?.data?.data as PaymentAdviceListResult) : null;
	const agingData = agingResult.status === "fulfilled" ? (agingResult.value?.data?.data as PaymentAgingResult) : null;

	return {
		advices: advicesData?.advices ?? [],
		advicesTotalPages: advicesData?.totalPages ?? 0,
		advicesTotalCount: advicesData?.total ?? 0,
		aging: agingData?.invoices ?? [],
		agingTotalPages: agingData?.totalPages ?? 0,
		agingTotalCount: agingData?.total ?? 0,
	};
};
