"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import AdvicesTable from "./advices-table";
import AgingTable from "./aging-table";

type PaymentsPageClientProps = {
	initialAdvices: PaymentAdvice[];
	initialAdvicesTotalPages: number;
	initialAdvicesTotalCount: number;
	initialAging: PaymentAgingInvoice[];
	initialAgingTotalPages: number;
	initialAgingTotalCount: number;
};

const PaymentsPageClient = ({ initialAdvices, initialAdvicesTotalPages, initialAdvicesTotalCount, initialAging, initialAgingTotalPages, initialAgingTotalCount }: PaymentsPageClientProps) => {
	return (
		<Tabs defaultValue="advices">
			<TabsList>
				<TabsTrigger value="advices">Payment Advices</TabsTrigger>
				<TabsTrigger value="aging">Aging (45+ days)</TabsTrigger>
			</TabsList>
			<TabsContent value="advices">
				<AdvicesTable initialData={initialAdvices} initialTotalPages={initialAdvicesTotalPages} initialTotalCount={initialAdvicesTotalCount} />
			</TabsContent>
			<TabsContent value="aging">
				<AgingTable initialData={initialAging} initialTotalPages={initialAgingTotalPages} initialTotalCount={initialAgingTotalCount} />
			</TabsContent>
		</Tabs>
	);
};

export default PaymentsPageClient;
