"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RfqTable, AddRfqDialog, RfqDetailSheet } from "./components";

const getAllRfqs = async () => {
	const response = await axios.get("/api/v1/rfq/all");
	return response?.data?.data ?? [];
};

export default function RFQPage() {
	const queryClient = useQueryClient();
	const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);

	const { data, isFetching } = useQuery<Rfq[]>({
		queryKey: ["rfqs-all"],
		queryFn: getAllRfqs,
		initialData: [],
		retry: 0,
	});

	const handleConfirmed = () => {
		queryClient.invalidateQueries({ queryKey: ["rfqs-all"] });
	};

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">RFQ Management</h1>
					<p className="text-sm text-muted-foreground">Manage your Request for Quotations</p>
				</div>
				<AddRfqDialog onConfirmed={handleConfirmed} />
			</div>

			<RfqTable data={data} isLoading={isFetching} onViewDetails={setSelectedRfq} />

			<RfqDetailSheet onClose={() => setSelectedRfq(null)} open={!!selectedRfq} rfq={selectedRfq} />
		</div>
	);
}
