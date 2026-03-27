"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Label } from "@components/ui/label";
import { Ban, Loader2 } from "lucide-react";

const REGRET_REASONS = [
	{ value: "NOT_IN_SCOPE", label: "Not in our scope" },
	{ value: "DRAWING_NOT_RECEIVED", label: "Drawing not received" },
	{ value: "ITEM_NOT_AVAILABLE", label: "Item not available" },
	{ value: "CUSTOM", label: "Custom reason" },
] as const;

interface RegretItemDialogProps {
	rfqItemId: string;
	rfqId: string;
	itemName: string;
}

const RegretItemDialog = ({ rfqItemId, rfqId, itemName }: RegretItemDialogProps) => {
	const [open, setOpen] = useState(false);
	const [reason, setReason] = useState<string>("NOT_IN_SCOPE");
	const [customReason, setCustomReason] = useState("");
	const queryClient = useQueryClient();

	const { mutate: markRegret, isPending } = useMutation({
		mutationFn: async () => {
			const response = await axios.patch(`/api/v1/rfqItem/${rfqItemId}/regret`, {
				isRegret: true,
				regretReason: reason,
				regretReasonCustom: reason === "CUSTOM" ? customReason : "",
			});
			return response?.data;
		},
		onSuccess: async () => {
			toast.success("Item marked as regret");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["rfq", rfqId] }),
				queryClient.invalidateQueries({ queryKey: ["costings-rfq", rfqId] }),
			]);
			setOpen(false);
			setReason("NOT_IN_SCOPE");
			setCustomReason("");
		},
		onError: (error: unknown) => {
			const axiosErr = error as { response?: { data?: { message?: string } } };
			toast.error(axiosErr?.response?.data?.message ?? "Failed to mark as regret");
		},
	});

	const canSubmit = reason !== "CUSTOM" || customReason.trim().length > 0;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
					<Ban className="mr-1 h-3 w-3" />
					Regret
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Regret Item</DialogTitle>
					<DialogDescription>
						Mark &quot;{itemName}&quot; as regretted. This item will not be quoted.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<RadioGroup value={reason} onValueChange={setReason}>
						{REGRET_REASONS.map(r => (
							<div key={r.value} className="flex items-center space-x-2">
								<RadioGroupItem value={r.value} id={r.value} />
								<Label htmlFor={r.value} className="cursor-pointer text-sm">
									{r.label}
								</Label>
							</div>
						))}
					</RadioGroup>

					{reason === "CUSTOM" && (
						<Textarea
							placeholder="Enter custom reason..."
							value={customReason}
							onChange={e => setCustomReason(e.target.value)}
							rows={3}
						/>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={() => markRegret()}
						disabled={isPending || !canSubmit}
					>
						{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Mark as Regret
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RegretItemDialog;
