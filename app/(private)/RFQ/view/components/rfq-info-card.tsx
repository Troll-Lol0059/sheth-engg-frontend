"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Badge } from "@components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
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
	const [form, setForm] = useState({
		prNumber: rfq.prNumber,
		companyName: rfq.companyName,
		location: rfq.location,
		ownerName: rfq.ownerName,
		startDate: rfq.startDate?.split("T")[0] ?? "",
		dueDate: rfq.dueDate?.split("T")[0] ?? "",
		status: rfq.status,
		deliveryWeeks: rfq.deliveryWeeks ?? "",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: () => updateRfqApi(rfq._id, form),
		onSuccess: () => {
			toast.success("RFQ updated successfully");
			queryClient.invalidateQueries({ queryKey: ["rfq", rfq._id] });
			setIsEditing(false);
		},
		onError: () => {
			toast.error("Failed to update RFQ");
		},
	});

	const handleCancel = () => {
		setForm({
			prNumber: rfq.prNumber,
			companyName: rfq.companyName,
			location: rfq.location,
			ownerName: rfq.ownerName,
			startDate: rfq.startDate?.split("T")[0] ?? "",
			dueDate: rfq.dueDate?.split("T")[0] ?? "",
			status: rfq.status,
			deliveryWeeks: rfq.deliveryWeeks ?? "",
		});
		setIsEditing(false);
	};

	const update = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

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
						<InfoItem icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} label="Start Date" value={rfq.startDate ? format(new Date(rfq.startDate), "dd MMM yyyy") : "—"} />
						<InfoItem icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} label="Due Date" value={rfq.dueDate ? format(new Date(rfq.dueDate), "dd MMM yyyy") : "—"} />
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
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="text-lg">Edit RFQ Information</CardTitle>
				<div className="flex gap-2">
					<Button disabled={isPending} onClick={handleCancel} size="sm" variant="outline">
						<X className="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button disabled={isPending} onClick={() => mutate()} size="sm">
						<Save className="mr-2 h-4 w-4" />
						{isPending ? "Saving..." : "Save"}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="prNumber">PR Number</Label>
						<Input id="prNumber" onChange={e => update("prNumber", e.target.value)} value={form.prNumber} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="companyName">Company</Label>
						<Input id="companyName" onChange={e => update("companyName", e.target.value)} value={form.companyName} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="location">Location</Label>
						<Input id="location" onChange={e => update("location", e.target.value)} value={form.location} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="ownerName">Owner</Label>
						<Input id="ownerName" onChange={e => update("ownerName", e.target.value)} value={form.ownerName} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="startDate">Start Date</Label>
						<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="startDate" onChange={e => update("startDate", e.target.value)} type="date" value={form.startDate} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="dueDate">Due Date</Label>
						<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="dueDate" onChange={e => update("dueDate", e.target.value)} type="date" value={form.dueDate} />
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="status">Status</Label>
						<Select onValueChange={val => update("status", val)} value={form.status}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{statusOptions.map(s => (
									<SelectItem key={s} value={s}>
										{s.replace(/_/g, " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="deliveryWeeks">Delivery Weeks</Label>
						<Input id="deliveryWeeks" min={1} max={52} onChange={e => update("deliveryWeeks", Number(e.target.value))} type="number" value={form.deliveryWeeks} />
					</div>
				</div>
			</CardContent>
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
