"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExtractionConfirmSchema, ExtractionConfirmFormValues } from "@schemas/rfq";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { DatePicker } from "@components/ui/date-picker";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Check, Pencil } from "lucide-react";

interface ExtractionPreviewProps {
	data: ExtractionResponse["data"];
	onConfirm: (payload: ConfirmPayload) => void;
	isConfirming: boolean;
}

const ExtractionPreview = ({ data, onConfirm, isConfirming }: ExtractionPreviewProps) => {
	const extracted = data.extractedData;

	const form = useForm<ExtractionConfirmFormValues>({
		resolver: zodResolver(ExtractionConfirmSchema),
		defaultValues: {
			prNumber: extracted.prNumber || "",
			supplyType: extracted.supplyType || "",
			location: extracted.location || "",
			companyName: extracted.companyName || "",
			dueDate: "",
			ownerName: "",
			items: extracted.items || [],
		},
	});

	const { fields } = useFieldArray({
		control: form.control,
		name: "items",
	});

	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const watchedItems = form.watch("items");

	const onSubmit = (values: ExtractionConfirmFormValues) => {
		onConfirm(values as ConfirmPayload);
	};

	const confidenceVariant = data.extraction.confidence >= 80 ? "success" : data.extraction.confidence >= 50 ? "warning" : "destructive";

	return (
		<Form {...form}>
			<form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
				{/* Extraction metadata */}
				<div className="flex flex-wrap items-center gap-3">
					<Badge variant={confidenceVariant}>Confidence: {data.extraction.confidence}%</Badge>
					<Badge variant="secondary">Layer: {data.extraction.layer}</Badge>
					<Badge variant={data.extraction.status === "FAILED" ? "destructive" : "default"}>{data.extraction.status}</Badge>
				</div>

				{/* Editable header fields */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						control={form.control}
						name="prNumber"
						render={({ field }) => (
							<FormItem>
								<FormLabel>PR Number *</FormLabel>
								<FormControl>
									<Input placeholder="PR Number" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="companyName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Company Name *</FormLabel>
								<FormControl>
									<Input placeholder="Company Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="location"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Location *</FormLabel>
								<FormControl>
									<Input placeholder="Location" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="supplyType"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Supply Type</FormLabel>
								<FormControl>
									<Input placeholder="Supply Type" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="ownerName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Owner Name</FormLabel>
								<FormControl>
									<Input placeholder="Owner Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="dueDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Due Date</FormLabel>
								<FormControl>
									<DatePicker
										disabledRange={date => date < new Date("1900-01-01")}
										onChange={date => field.onChange(date ? date.toISOString() : "")}
										placeholder="Select due date"
										value={field.value ? new Date(field.value) : undefined}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Items table */}
				<div className="flex flex-col gap-2">
					<h3 className="text-sm font-semibold">Extracted Items ({fields.length})</h3>
					{fields.length > 0 ? (
						<div className="rounded-xl border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Sl. No.</TableHead>
										<TableHead>Item Code</TableHead>
										<TableHead>Item Name</TableHead>
										<TableHead>Quantity</TableHead>
										<TableHead>Drawing No.</TableHead>
										<TableHead>Material</TableHead>
										<TableHead>Grade</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{fields.map((field, idx) => (
										<TableRow key={field.id}>
											<TableCell>
												{editingIndex === idx ? (
													<FormField
														control={form.control}
														name={`items.${idx}.serialNumber`}
														render={({ field }) => (
															<FormControl>
																<Input className="h-8 w-16" {...field} />
															</FormControl>
														)}
													/>
												) : (
													watchedItems[idx]?.serialNumber || idx + 1
												)}
											</TableCell>
											<TableCell>
												{editingIndex === idx ? (
													<FormField
														control={form.control}
														name={`items.${idx}.itemCode`}
														render={({ field }) => (
															<FormControl>
																<Input className="h-8 w-24" {...field} />
															</FormControl>
														)}
													/>
												) : (
													watchedItems[idx]?.itemCode || "\u2014"
												)}
											</TableCell>
											<TableCell>
												{editingIndex === idx ? (
													<FormField
														control={form.control}
														name={`items.${idx}.itemName`}
														render={({ field }) => (
															<FormControl>
																<Input className="h-8 w-32" {...field} />
															</FormControl>
														)}
													/>
												) : (
													watchedItems[idx]?.itemName || "\u2014"
												)}
											</TableCell>
											<TableCell>
												{editingIndex === idx ? (
													<FormField
														control={form.control}
														name={`items.${idx}.quantity`}
														render={({ field }) => (
															<FormControl>
																<Input className="h-8 w-20" type="number" {...field} />
															</FormControl>
														)}
													/>
												) : (
													watchedItems[idx]?.quantity
												)}
											</TableCell>
											<TableCell>{watchedItems[idx]?.drawingNumber || "\u2014"}</TableCell>
											<TableCell>{watchedItems[idx]?.technical?.material || "\u2014"}</TableCell>
											<TableCell>{watchedItems[idx]?.technical?.grade || "\u2014"}</TableCell>
											<TableCell>
												<Button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)} size="icon" type="button" variant="ghost">
													{editingIndex === idx ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">No items extracted. You may need to re-extract or enter data manually.</p>
					)}
				</div>

				{/* Confirm button */}
				<Button className="self-end" disabled={isConfirming} type="submit">
					{isConfirming ? "Creating RFQ..." : "Confirm & Create RFQ"}
				</Button>
			</form>
		</Form>
	);
};

export default ExtractionPreview;
