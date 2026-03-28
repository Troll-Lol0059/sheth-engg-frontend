"use client";
import { useRouter } from "next/navigation";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/ui/tabs";
import { ArrowLeft, Package, Calculator, Wrench } from "lucide-react";
import RfqInfoCard from "./rfq-info-card";
import RfqItemsSection from "./rfq-items-section";
import BulkDrawingUpload from "./bulk-drawing-upload";
import CostingSummary from "./costing-summary";
import TechnicalSummary from "./technical-summary";
import MarkQuotedDialog from "./mark-quoted-dialog";
import ModuleHelp from "@components/common/module-help";
import { rfqViewHelp } from "@data/helpData";

interface RfqViewContentProps {
	rfq: Rfq;
}

const RfqViewContent = ({ rfq: initialRfq }: RfqViewContentProps) => {
	const router = useRouter();

	const { data: rfq } = useQuery<Rfq>({
		queryKey: ["rfq", initialRfq._id],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/rfq/${initialRfq._id}`);
			return response?.data?.data as Rfq;
		},
		initialData: initialRfq,
		retry: 0,
	});

	const items = (rfq.items ?? []) as RfqLineItem[];
	const hasPopulatedItems = items.length > 0 && typeof items[0] !== "string";

	return (
		<div className="flex flex-col gap-6 p-4 sm:p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-center gap-3">
					<Button className="h-9 w-9 shrink-0" onClick={() => router.push(rfq.isRegret ? "/RFQ/regret" : rfq.isRevised ? "/RFQ/revised" : rfq.isQuoted ? "/RFQ/quoted" : "/RFQ/pending")} size="icon" variant="ghost">
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div className="min-w-0">
						<h1 className="truncate text-xl font-bold sm:text-2xl">RFQ — {rfq.prNumber}</h1>
						<p className="truncate text-sm text-muted-foreground">
							{rfq.companyName} &middot; {rfq.location}
							{rfq.quotationNumber ? ` · Q.No: ${rfq.quotationNumber}` : ""}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
					<ModuleHelp description="Complete guide to RFQ details, costing, and offers" sections={rfqViewHelp} title="RFQ Detail — Help" />
					<MarkQuotedDialog rfq={rfq} />
				</div>
			</div>

			<Separator />

			<RfqInfoCard rfq={rfq} />

			{hasPopulatedItems ? (
				<Tabs defaultValue="line-items" className="w-full">
					<div className="overflow-x-auto">
						<TabsList>
							<TabsTrigger value="line-items" className="gap-1.5">
								<Package className="h-4 w-4" />
								<span className="hidden sm:inline">Line</span> Items
							</TabsTrigger>
							<TabsTrigger value="costing" className="gap-1.5">
								<Calculator className="h-4 w-4" />
								Costing
							</TabsTrigger>
							<TabsTrigger value="technical" className="gap-1.5">
								<Wrench className="h-4 w-4" />
								Technical
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="line-items" className="space-y-4">
						<RfqItemsSection items={items} rfqId={rfq._id} />
						<BulkDrawingUpload items={items} rfqId={rfq._id} />
					</TabsContent>

					<TabsContent value="costing">
						<CostingSummary items={items} rfqId={rfq._id} />
					</TabsContent>

					<TabsContent value="technical">
						<TechnicalSummary items={items} rfqId={rfq._id} />
					</TabsContent>
				</Tabs>
			) : items.length > 0 ? (
				<div className="rounded-xl border bg-card p-6">
					<p className="text-sm text-muted-foreground">This RFQ has {items.length} item(s) but item details are not populated.</p>
				</div>
			) : null}
		</div>
	);
};

export default RfqViewContent;
