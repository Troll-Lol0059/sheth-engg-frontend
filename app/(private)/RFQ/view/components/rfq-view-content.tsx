"use client";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { ArrowLeft } from "lucide-react";
import RfqInfoCard from "./rfq-info-card";
import RfqItemsSection from "./rfq-items-section";
import BulkDrawingUpload from "./bulk-drawing-upload";
import CostingSummary from "./costing-summary";

interface RfqViewContentProps {
	rfq: Rfq;
}

const RfqViewContent = ({ rfq }: RfqViewContentProps) => {
	const router = useRouter();
	const items = (rfq.items ?? []) as RfqLineItem[];
	const hasPopulatedItems = items.length > 0 && typeof items[0] !== "string";

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button className="h-9 w-9" onClick={() => router.push("/RFQ")} size="icon" variant="ghost">
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">RFQ — {rfq.prNumber}</h1>
						<p className="text-sm text-muted-foreground">
							{rfq.companyName} &middot; {rfq.location}
						</p>
					</div>
				</div>
			</div>

			<Separator />

			<RfqInfoCard rfq={rfq} />

			{hasPopulatedItems ? (
				<>
					<RfqItemsSection items={items} rfqId={rfq._id} />
					<CostingSummary items={items} rfqId={rfq._id} />
					<BulkDrawingUpload items={items} rfqId={rfq._id} />
				</>
			) : items.length > 0 ? (
				<div className="rounded-xl border bg-card p-6">
					<p className="text-sm text-muted-foreground">This RFQ has {items.length} item(s) but item details are not populated.</p>
				</div>
			) : null}
		</div>
	);
};

export default RfqViewContent;
