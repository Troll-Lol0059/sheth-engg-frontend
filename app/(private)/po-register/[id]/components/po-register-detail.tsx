"use client";

import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import ModuleHelp from "@components/common/module-help";
import { poDetailHelp } from "@data/helpData";

const formatCurrency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

const formatDate = (date: string) => new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const PORegisterDetail = ({ poId, initialData }: { poId: string; initialData: PORegister | null }) => {
	const { data: po, isLoading } = useQuery<PORegister>({
		queryKey: ["po-register", poId],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/po-register/${poId}`);
			return response?.data?.data as PORegister;
		},
		initialData: initialData ?? undefined,
	});

	if (isLoading) {
		return (
			<div className="flex h-[calc(100vh-4rem)] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!po) {
		return (
			<div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Purchase order not found</p>
				<Link href="/po-register">
					<Button variant="outline">Back to PO Register</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			{/* Back Button & Help */}
			<div className="flex items-center justify-between">
				<Link href="/po-register">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to PO Register
					</Button>
				</Link>
				<ModuleHelp description="Guide to PO details and line items" sections={poDetailHelp} title="PO Detail — Help" />
			</div>

			{/* Header Card */}
			<Card>
				<CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
					<div>
						<p className="text-muted-foreground text-sm">PO Number</p>
						<p className="text-lg font-semibold">{po.poNumber || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Job Number</p>
						<p className="text-lg font-semibold">{po.jobNumber || "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">PO Date</p>
						<p className="text-lg font-semibold">{po.poDate ? formatDate(po.poDate) : "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Delivery Date</p>
						<p className="text-lg font-semibold">{po.deliveryDate ? formatDate(po.deliveryDate) : "—"}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-sm">Company Name</p>
						<p className="text-lg font-semibold">{po.companyName || "—"}</p>
					</div>
				</CardContent>
			</Card>

			{/* Line Items Table */}
			<div>
				<h2 className="mb-4 text-lg font-semibold">Line Items</h2>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Sl.No</TableHead>
								<TableHead>Item Code</TableHead>
								<TableHead className="min-w-[250px]">Item Description</TableHead>
								<TableHead>Drawing No</TableHead>
								<TableHead className="text-right">Quantity</TableHead>
								<TableHead className="text-right">Rate</TableHead>
								<TableHead className="text-right">Basic Value</TableHead>
								<TableHead className="text-right">IGST</TableHead>
								<TableHead className="text-right">Net Amount</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{po.items?.length > 0 ? (
								po.items.map((item, index) => (
									<TableRow key={item._id ?? index}>
										<TableCell>{item.serialNumber}</TableCell>
										<TableCell className="font-medium">{item.itemCode}</TableCell>
										<TableCell style={{ whiteSpace: "pre-line" }}>{item.itemDescription}</TableCell>
										<TableCell>{item.drawingNumber || "—"}</TableCell>
										<TableCell className="text-right">{item.quantity}</TableCell>
										<TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
										<TableCell className="text-right">{formatCurrency(item.basicValue)}</TableCell>
										<TableCell className="text-right">{formatCurrency(item.igst)}</TableCell>
										<TableCell className="text-right">{formatCurrency(item.netAmount)}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={9} className="h-24 text-center">
										No line items found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						{po.items?.length > 0 && (
							<TableFooter>
								<TableRow>
									<TableCell colSpan={6} className="text-right font-semibold">
										Totals
									</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(po.totalBasicValue)}</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(po.totalTax)}</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(po.totalNetAmount)}</TableCell>
								</TableRow>
								<TableRow>
									<TableCell colSpan={8} className="text-right font-semibold">
										Round Off
									</TableCell>
									<TableCell className="text-right font-semibold">{formatCurrency(po.totalRoundOff)}</TableCell>
								</TableRow>
							</TableFooter>
						)}
					</Table>
				</div>
			</div>
		</div>
	);
};

export default PORegisterDetail;
