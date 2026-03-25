"use client";

import { useState } from "react";
import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { BarChart3, Loader2 } from "lucide-react";
import ModuleHelp from "@components/common/module-help";
import { vendorComparisonHelp } from "@data/helpData";

type ComparisonType = "material" | "labour" | "supply";

type VendorComparisonContentProps = {
	initialData: Record<string, unknown>[];
};

const VendorComparisonContent = ({ initialData }: VendorComparisonContentProps) => {
	const [type, setType] = useState<ComparisonType>("material");

	const { data: comparison = [], isLoading } = useQuery<Record<string, unknown>[]>({
		queryKey: ["vendor-comparison", type],
		queryFn: async () => {
			const response = await axios.get(`/api/v1/rate-history/vendor-comparison?type=${type}`);
			return (response?.data?.data ?? []) as Record<string, unknown>[];
		},
		initialData: type === "material" ? initialData : undefined,
	});

	return (
		<div className="space-y-4 p-6">
			<div className="flex items-center justify-between">
				<h1 className="flex items-center gap-2 text-xl font-semibold">
					<BarChart3 className="h-5 w-5" />
					Vendor Comparison
				</h1>
				<div className="flex items-center gap-2">
					<ModuleHelp description="Guide to vendor comparison analysis" sections={vendorComparisonHelp} title="Vendor Comparison — Help" />
					{(["material", "labour", "supply"] as ComparisonType[]).map(t => (
						<Button key={t} onClick={() => setType(t)} size="sm" variant={type === t ? "default" : "outline"}>
							{t === "material" ? "Raw Material" : t === "labour" ? "Labour" : "Complete Supply"}
						</Button>
					))}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{type === "material" ? "Raw Material Dealers" : type === "labour" ? "Labour Job Workers" : "Complete Supply Vendors"}
						{comparison.length > 0 && (
							<Badge variant="outline" className="ml-2">
								{comparison.length} vendors
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="text-primary h-5 w-5 animate-spin" />
						</div>
					) : comparison.length === 0 ? (
						<p className="text-muted-foreground py-8 text-center text-sm">No vendor data available for this category.</p>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Vendor</TableHead>
										{type === "labour" && <TableHead>Process</TableHead>}
										<TableHead className="text-right">Avg Rate (&#8377;)</TableHead>
										<TableHead className="text-right">Min Rate (&#8377;)</TableHead>
										<TableHead className="text-right">Max Rate (&#8377;)</TableHead>
										<TableHead className="text-right">Latest Rate (&#8377;)</TableHead>
										{type === "labour" && <TableHead>Rate Type</TableHead>}
										<TableHead className="text-right">Orders</TableHead>
										<TableHead>Last Used</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{comparison.map((row, i) => (
										<TableRow key={i}>
											<TableCell className="font-medium">{String(row.partyName ?? "Unknown")}</TableCell>
											{type === "labour" && <TableCell>{String(row.processName ?? "\u2014")}</TableCell>}
											<TableCell className="text-right font-semibold">{((row.avgRate as number) ?? 0).toFixed(2)}</TableCell>
											<TableCell className="text-right text-green-700">{((row.minRate as number) ?? 0).toFixed(2)}</TableCell>
											<TableCell className="text-right text-red-600">{((row.maxRate as number) ?? 0).toFixed(2)}</TableCell>
											<TableCell className="text-right">{((row.latestRate as number) ?? 0).toFixed(2)}</TableCell>
											{type === "labour" && (
												<TableCell>
													<Badge variant="outline" className="text-[10px]">
														{String(row.rateType ?? "")}
													</Badge>
												</TableCell>
											)}
											<TableCell className="text-right">{String(row.totalOrders ?? 0)}</TableCell>
											<TableCell className="text-muted-foreground text-xs">{row.lastUsed ? new Date(row.lastUsed as string).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "\u2014"}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};

export default VendorComparisonContent;
