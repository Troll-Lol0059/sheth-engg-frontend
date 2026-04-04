"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RfqInfoSchema, RfqInfoFormValues } from "@schemas/rfq";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { DatePicker } from "@components/ui/date-picker";
import { Pencil, Save, X, CalendarDays, Building2, MapPin, User, Hash, Truck } from "lucide-react";
import { format } from "date-fns";

interface RfqInfoCardProps {
	rfq: Rfq;
}

const statusVariantMap: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
	PREVIEW: "secondary",
	ACCEPTING_RESPONSE: "default",
	PENDING_SELECTION: "warning",
	AWARDED: "success",
	COMPLETED: "success",
};

const statusOptions = ["PREVIEW", "ACCEPTING_RESPONSE", "PENDING_SELECTION", "AWARDED", "COMPLETED"];

const updateRfqApi = async (rfqId: string, data: Record<string, unknown>) => {
	const response = await axios.put(`/api/v1/rfq/${rfqId}`, data);
	return response?.data;
};

const RfqInfoCard = ({ rfq }: RfqInfoCardProps) => {
	const queryClient = useQueryClient();
	const [isEditing, setIsEditing] = useState(false);

	const defaultValues: RfqInfoFormValues = {
		prNumber: rfq.prNumber,
		companyName: rfq.companyName,
		location: rfq.location,
		ownerName: rfq.ownerName ?? "",
		startDate: rfq.startDate?.split("T")[0] ?? "",
		dueDate: rfq.dueDate?.split("T")[0] ?? "",
		status: rfq.status as RfqInfoFormValues["status"],
		deliveryWeeks: rfq.deliveryWeeks ?? undefined,
	};

	const form = useForm<RfqInfoFormValues>({
		resolver: zodResolver(RfqInfoSchema),
		defaultValues,
	});

	const { mutate, isPending } = useMutation({
		mutationFn: (data: RfqInfoFormValues) => updateRfqApi(rfq._id, data as unknown as Record<string, unknown>),
		onSuccess: () => {
			toast.success("RFQ updated successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			setIsEditing(false);
		},
		onError: () => {
			toast.error("Failed to update RFQ");
		},
	});

	const onSubmit = (data: RfqInfoFormValues) => {
		mutate(data);
	};

	const handleCancel = () => {
		form.reset(defaultValues);
		setIsEditing(false);
	};

	if (!isEditing) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg">RFQ Information</CardTitle>
					<Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
						<Pencil className="mr-2 h-4 w-4" />
						Edit
					</Button>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<InfoItem icon={<Hash className="h-4 w-4 text-muted-foreground" />} label="PR Number" value={rfq.prNumber} />
						<InfoItem icon={<Building2 className="h-4 w-4 text-muted-foreground" />} label="Company" value={rfq.companyName} />
						<InfoItem icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Location" value={rfq.location} />
						<InfoItem icon={<User className="h-4 w-4 text-muted-foreground" />} label="Owner" value={rfq.ownerName} />
						<InfoItem icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} label="Start Date" value={rfq.startDate ? format(new Date(rfq.startDate), "dd MMM yyyy, HH:mm") : "—"} />
						<InfoItem icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} label="Due Date" value={rfq.dueDate ? format(new Date(rfq.dueDate), "dd/MM/yyyy") : "—"} />
						<div className="flex flex-col gap-1.5">
							<span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">Status</span>
							<Badge className="w-fit" variant={statusVariantMap[rfq.status] ?? "default"}>
								{rfq.status.replace(/_/g, " ")}
							</Badge>
						</div>
						<InfoItem icon={<Truck className="h-4 w-4 text-muted-foreground" />} label="Delivery Weeks" value={rfq.deliveryWeeks ? String(rfq.deliveryWeeks) : "—"} />
						<InfoItem label="Quoted" value={rfq.isQuoted ? "Yes" : "No"} />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-primary/20">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="text-lg">Edit RFQ Information</CardTitle>
						<div className="flex gap-2">
							<Button disabled={isPending} onClick={handleCancel} size="sm" type="button" variant="outline">
								<X className="mr-2 h-4 w-4" />
								Cancel
							</Button>
							<Button disabled={isPending} size="sm" type="submit">
								<Save className="mr-2 h-4 w-4" />
								{isPending ? "Saving..." : "Save"}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<FormField
								control={form.control}
								name="prNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>PR Number</FormLabel>
										<FormControl>
											<Input {...field} />
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
										<FormLabel>Company</FormLabel>
										<FormControl>
											<Input {...field} />
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
										<FormLabel>Location</FormLabel>
										<FormControl>
											<Input {...field} />
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
										<FormLabel>Owner</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start Date</FormLabel>
										<FormControl>
											<DatePicker
												disabledRange={() => false}
												onChange={date => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
												placeholder="Select start date"
												value={field.value ? new Date(field.value) : undefined}
											/>
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
												disabledRange={() => false}
												onChange={date => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
												placeholder="Select due date"
												value={field.value ? new Date(field.value) : undefined}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Status</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{statusOptions.map(s => (
													<SelectItem key={s} value={s}>
														{s.replace(/_/g, " ")}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="deliveryWeeks"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Delivery Weeks</FormLabel>
										<FormControl>
											<Input
												max={52}
												min={0}
												onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
												type="number"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
				</form>
			</Form>
		</Card>
	);
};

const InfoItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
	<div className="flex flex-col gap-1.5">
		<span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
			{icon}
			{label}
		</span>
		<span className="text-sm font-medium">{value || "—"}</span>
	</div>
);

export default RfqInfoCard;
