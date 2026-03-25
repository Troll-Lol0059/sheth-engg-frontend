"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Card, CardContent } from "@components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { History, Loader2, FileSpreadsheet, ClipboardList, IndianRupee } from "lucide-react";
import Link from "next/link";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (date: string | null) => {
	if (!date) return "—";
	return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type QuotationHistoryEntry = {
	rfqId: string;
	rfqItemId: string;
	prNumber: string;
	companyName: string;
	quotationNumber: number | null;
	quotedOn: string | null;
	isRevised: boolean;
	revisionDate: string | null;
	sellingPrice: number;
	totalCost: number;
	quantity: number;
};

type SaleHistoryEntry = {
	poId: string;
	jobNumber: string;
	poNumber: string;
	poDate: string | null;
	companyName: string;
	rate: number;
	quantity: number;
	basicValue: number;
};

type ItemHistoryData = {
	itemCode: string;
	quotationHistory: QuotationHistoryEntry[];
	saleHistory: SaleHistoryEntry[];
};

interface ItemHistoryDialogProps {
	itemCode: string;
	itemName: string;
}

const ItemHistoryDialog = ({ itemCode, itemName }: ItemHistoryDialogProps) => {
	const [open, setOpen] = useState(false);

	const { data, isLoading } = useQuery<ItemHistoryData>({
		queryKey: ["item-history", itemCode],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/item-history/${encodeURIComponent(itemCode)}`);
			return response?.data?.data as ItemHistoryData;
		},
		enabled: open && !!itemCode,
	});

	const quotationHistory = data?.quotationHistory ?? [];
	const saleHistory = data?.saleHistory ?? [];

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" title="Item History">
					<History className="mr-2 h-3 w-3" />
					History
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<History className="h-5 w-5" />
						Item History — {itemCode}
					</DialogTitle>
					<p className="text-muted-foreground text-sm">{itemName}</p>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="text-primary h-8 w-8 animate-spin" />
					</div>
				) : (
					<Tabs defaultValue="quotation">
						<TabsList className="w-full">
							<TabsTrigger className="flex-1" value="quotation">
								<ClipboardList className="mr-2 h-4 w-4" />
								Quotation History ({quotationHistory.length})
							</TabsTrigger>
							<TabsTrigger className="flex-1" value="sale">
								<FileSpreadsheet className="mr-2 h-4 w-4" />
								PO / Sale History ({saleHistory.length})
							</TabsTrigger>
						</TabsList>

						<TabsContent className="mt-4" value="quotation">
							{quotationHistory.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center gap-2 py-8">
										<ClipboardList className="text-muted-foreground h-10 w-10" />
										<p className="text-muted-foreground text-sm">No quotation history found for this item</p>
									</CardContent>
								</Card>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>PR Number</TableHead>
												<TableHead>Company</TableHead>
												<TableHead>Quotation #</TableHead>
												<TableHead>Quoted On</TableHead>
												<TableHead>Qty</TableHead>
												<TableHead>Selling Rate</TableHead>
												<TableHead>Revised</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{quotationHistory.map((entry, idx) => (
												<TableRow key={`q-${idx}`}>
													<TableCell>
														<Link className="text-primary hover:underline" href={`/RFQ/view?rfqId=${entry.rfqId}`}>
															{entry.prNumber}
														</Link>
													</TableCell>
													<TableCell className="max-w-[150px] truncate" title={entry.companyName}>
														{entry.companyName}
													</TableCell>
													<TableCell>{entry.quotationNumber ?? "—"}</TableCell>
													<TableCell>{formatDate(entry.quotedOn)}</TableCell>
													<TableCell>{entry.quantity}</TableCell>
													<TableCell className="font-medium">
														{entry.sellingPrice > 0 ? (
															<span className="flex items-center gap-1">
																<IndianRupee className="h-3 w-3" />
																{formatCurrency(entry.sellingPrice).replace("₹", "")}
															</span>
														) : (
															"—"
														)}
													</TableCell>
													<TableCell>{entry.isRevised ? <Badge variant="secondary">Revised {entry.revisionDate ? formatDate(entry.revisionDate) : ""}</Badge> : "—"}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</TabsContent>

						<TabsContent className="mt-4" value="sale">
							{saleHistory.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center gap-2 py-8">
										<FileSpreadsheet className="text-muted-foreground h-10 w-10" />
										<p className="text-muted-foreground text-sm">No PO / sale history found for this item</p>
									</CardContent>
								</Card>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Job No.</TableHead>
												<TableHead>PO Number</TableHead>
												<TableHead>PO Date</TableHead>
												<TableHead>Company</TableHead>
												<TableHead>Qty</TableHead>
												<TableHead>Rate</TableHead>
												<TableHead>Basic Value</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{saleHistory.map((entry, idx) => (
												<TableRow key={`s-${idx}`}>
													<TableCell className="font-medium">{entry.jobNumber}</TableCell>
													<TableCell>
														<Link className="text-primary hover:underline" href={`/po-register/${entry.poId}`}>
															<span className="block max-w-[180px] truncate" title={entry.poNumber}>
																{entry.poNumber}
															</span>
														</Link>
													</TableCell>
													<TableCell>{formatDate(entry.poDate)}</TableCell>
													<TableCell className="max-w-[150px] truncate" title={entry.companyName}>
														{entry.companyName}
													</TableCell>
													<TableCell>{entry.quantity}</TableCell>
													<TableCell className="font-medium">{formatCurrency(entry.rate)}</TableCell>
													<TableCell>{formatCurrency(entry.basicValue)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</TabsContent>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ItemHistoryDialog;
