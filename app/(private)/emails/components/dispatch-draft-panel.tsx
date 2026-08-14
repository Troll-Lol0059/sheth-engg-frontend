"use client";
import { useState } from "react";
import DOMPurify from "dompurify";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Loader2, Mail, Send, Sparkles } from "lucide-react";

type DispatchDraft = {
	subject: string;
	to: string[];
	htmlBody: string;
};

interface DispatchDraftPanelProps {
	emailId: string;
}

/**
 * Draft-for-review only, per the agreed design — this panel never sends on
 * its own. Generate fetches a suggested subject/body from the matching
 * service, the user edits it inline, and Send explicitly triggers the
 * existing threaded-reply endpoint.
 */
const DispatchDraftPanel = ({ emailId }: DispatchDraftPanelProps) => {
	const [draft, setDraft] = useState<DispatchDraft | null>(null);

	const generateMutation = useMutation({
		mutationFn: async () => {
			const response = await axios.get(`/api/v1/email/${emailId}/dispatch-draft`);
			return response?.data?.data as DispatchDraft;
		},
		onSuccess: data => setDraft(data),
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to generate draft");
		},
	});

	const sendMutation = useMutation({
		mutationFn: async () => {
			if (!draft) return;
			const response = await axios.post(`/api/v1/email/${emailId}/reply`, {
				to: draft.to,
				subject: draft.subject,
				htmlBody: draft.htmlBody,
			});
			return response?.data?.data;
		},
		onSuccess: () => {
			toast.success("Reply sent");
			setDraft(null);
		},
		onError: (error: AxiosError<ErrorData>) => {
			toast.error(error.response?.data?.message ?? "Failed to send reply");
		},
	});

	if (!draft) {
		return (
			<Button disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()} size="sm">
				{generateMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
				Generate Dispatch Status Draft
			</Button>
		);
	}

	const previewHtml = DOMPurify.sanitize(draft.htmlBody, {
		ALLOWED_TAGS: ["p", "br", "table", "thead", "tbody", "tr", "th", "td"],
		ALLOWED_ATTR: ["style", "colspan"],
	});

	return (
		<div className="flex flex-col gap-3 rounded-md border p-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<Mail className="h-4 w-4" />
				Draft Reply (review before sending)
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="dispatch-draft-to">To</Label>
				<Input
					id="dispatch-draft-to"
					onChange={e => setDraft({ ...draft, to: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })}
					value={draft.to.join(", ")}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="dispatch-draft-subject">Subject</Label>
				<Input id="dispatch-draft-subject" onChange={e => setDraft({ ...draft, subject: e.target.value })} value={draft.subject} />
			</div>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="dispatch-draft-body">Body (HTML)</Label>
				<Textarea
					className="min-h-[160px] font-mono text-xs"
					id="dispatch-draft-body"
					onChange={e => setDraft({ ...draft, htmlBody: e.target.value })}
					value={draft.htmlBody}
				/>
			</div>
			<div>
				<Label className="text-muted-foreground text-xs">Preview</Label>
				<div className="prose prose-sm max-w-none rounded-md border bg-white p-3" dangerouslySetInnerHTML={{ __html: previewHtml }} />
			</div>
			<div className="flex justify-end gap-2">
				<Button onClick={() => setDraft(null)} variant="outline">
					Discard
				</Button>
				<Button disabled={sendMutation.isPending || draft.to.length === 0} onClick={() => sendMutation.mutate()}>
					{sendMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
					Send Reply
				</Button>
			</div>
		</div>
	);
};

export default DispatchDraftPanel;
