"use client";

import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@config/axios";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@components/ui/sheet";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { ScrollArea } from "@components/ui/scroll-area";
import { Download, ExternalLink, FileText, Globe, Paperclip, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import EmailCategoryBadge from "./email-category-badge";

interface EmailDetailSheetProps {
	email: EmailRecord | null;
	open: boolean;
	onClose: () => void;
	onCreateRfq: () => void;
	onLinkRfq: () => void;
}

const InfoField = ({ label, value }: { label: string; value: string }) => (
	<div>
		<span className="text-muted-foreground text-xs">{label}</span>
		<p className="text-sm font-medium">{value || "—"}</p>
	</div>
);

const EmailDetailSheet = ({ email, open, onClose, onCreateRfq, onLinkRfq }: EmailDetailSheetProps) => {
	const queryClient = useQueryClient();
	const htmlRef = useRef<HTMLDivElement>(null);

	const { mutate: markRead } = useMutation({
		mutationFn: (id: string) => axios.patch(`/api/v1/email/${id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["emails"] });
			queryClient.invalidateQueries({ queryKey: ["email-unread-count"] });
		},
	});

	useEffect(() => {
		if (email && !email.isRead) {
			markRead(email._id);
		}
	}, [email?._id]);

	if (!email) return null;

	const sanitizedHtml = email.htmlBody
		? DOMPurify.sanitize(email.htmlBody, {
				ALLOWED_TAGS: ["p", "br", "b", "i", "strong", "em", "a", "ul", "ol", "li", "table", "tr", "td", "th", "thead", "tbody", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6", "img"],
				ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "width", "height", "target", "rel"],
				ALLOW_DATA_ATTR: false,
				ADD_ATTR: ["target"],
		  })
		: "";

	// Force all links in sanitized HTML to open in new tab
	const htmlWithTargetBlank = sanitizedHtml.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');

	const classification = email.classification;
	const extracted = classification.extractedData;

	return (
		<Sheet onOpenChange={v => !v && onClose()} open={open}>
			<SheetContent className="w-full sm:max-w-4xl" side="right">
				<SheetHeader>
					<SheetTitle className="text-base">{email.subject || "(no subject)"}</SheetTitle>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-80px)] pr-4">
					<div className="space-y-4 pb-8">
						{/* Header */}
						<div className="grid grid-cols-2 gap-3">
							<InfoField label="From" value={`${email.from.name} <${email.from.address}>`} />
							<InfoField label="Date" value={email.date ? format(new Date(email.date), "dd MMM yyyy HH:mm") : "—"} />
							<InfoField label="To" value={email.to.map(t => t.address).join(", ")} />
							{email.cc.length > 0 && <InfoField label="CC" value={email.cc.map(c => c.address).join(", ")} />}
						</div>

						<div className="flex flex-wrap gap-2">
							<EmailCategoryBadge category={classification.category} />
							<Badge variant="outline">{email.source}</Badge>
							{classification.confidence > 0 && <Badge variant="outline">{classification.confidence}% confidence</Badge>}
						</div>

						<Separator />

						{/* Classification data */}
						{classification.extractedData.summary && (
							<div className="rounded-md bg-muted/50 p-3">
								<p className="text-muted-foreground text-xs font-medium">AI Summary</p>
								<p className="text-sm">{extracted.summary}</p>
							</div>
						)}

						{(extracted.prNumbers.length > 0 || extracted.poNumbers.length > 0 || extracted.companyNames.length > 0) && (
							<div className="grid grid-cols-2 gap-3">
								{extracted.prNumbers.length > 0 && <InfoField label="PR Numbers" value={extracted.prNumbers.join(", ")} />}
								{extracted.poNumbers.length > 0 && <InfoField label="PO Numbers" value={extracted.poNumbers.join(", ")} />}
								{extracted.companyNames.length > 0 && <InfoField label="Companies" value={extracted.companyNames.join(", ")} />}
								{extracted.location && <InfoField label="Location" value={extracted.location} />}
								{extracted.contactPerson && <InfoField label="Contact" value={extracted.contactPerson} />}
								{extracted.dueDate && <InfoField label="Due Date" value={format(new Date(extracted.dueDate), "dd/MM/yyyy")} />}
							</div>
						)}

						{extracted.actionItems.length > 0 && (
							<div>
								<p className="text-muted-foreground mb-1 text-xs font-medium">Action Items</p>
								<ul className="list-inside list-disc text-sm">
									{extracted.actionItems.map((item, i) => (
										<li key={i}>{item}</li>
									))}
								</ul>
							</div>
						)}

						{/* Linked records */}
						{email.linkedRfq && (
							<>
								<Separator />
								<div className="space-y-2">
									<p className="text-muted-foreground text-xs font-medium">Linked Records</p>
									<div className="flex items-center gap-2 rounded-md border p-2">
										<FileText className="h-4 w-4 text-blue-600" />
										<div>
											<p className="text-sm font-medium">RFQ {email.linkedRfq.prNumber}</p>
											<p className="text-muted-foreground text-xs">{email.linkedRfq.companyName} — {email.linkedRfq.status}</p>
										</div>
									</div>
								</div>
							</>
						)}

						{/* Attachments */}
						{email.attachments.length > 0 && (
							<>
								<Separator />
								<div>
									<p className="text-muted-foreground mb-2 text-xs font-medium">Attachments ({email.attachments.length})</p>
									<div className="space-y-1">
										{email.attachments.map(att => (
											<div className="flex items-center gap-2 rounded-md border p-2" key={att._id}>
												<Paperclip className="h-4 w-4 shrink-0" />
												<span className="flex-1 truncate text-sm">{att.filename}</span>
												<span className="text-muted-foreground text-xs">{(att.size / 1024).toFixed(0)} KB</span>
												{att.cloudinaryUrl && (
													<div className="flex shrink-0 gap-1">
														<a href={att.cloudinaryUrl} rel="noopener noreferrer" target="_blank">
															<Button size="sm" variant="outline">
																<ExternalLink className="mr-1 h-3 w-3" />
																Open
															</Button>
														</a>
														<a download={att.filename} href={att.cloudinaryUrl} rel="noopener noreferrer" target="_blank">
															<Button size="sm" variant="outline">
																<Download className="mr-1 h-3 w-3" />
																Download
															</Button>
														</a>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							</>
						)}

						{/* Ariba links */}
						{email.aribaLinks.length > 0 && (
							<>
								<Separator />
								<div>
									<p className="text-muted-foreground mb-2 text-xs font-medium">Ariba Links ({email.aribaLinks.length})</p>
									<div className="space-y-2">
										{email.aribaLinks.map((link, idx) => (
											<div className="flex items-center gap-2 rounded-md border p-2" key={idx}>
												<Globe className="h-4 w-4 shrink-0 text-orange-600" />
												<div className="min-w-0 flex-1">
													<p className="truncate text-xs">{link.url}</p>
													<div className="mt-1 flex items-center gap-1">
														{link.downloadStatus === "DOWNLOADED" && <CheckCircle className="h-3 w-3 text-green-600" />}
														{link.downloadStatus === "DOWNLOADING" && <Loader2 className="h-3 w-3 animate-spin" />}
														{link.downloadStatus === "FAILED" && <AlertCircle className="h-3 w-3 text-red-600" />}
														<span className="text-muted-foreground text-[10px]">{link.downloadStatus.replace(/_/g, " ")}</span>
													</div>
												</div>
												<a href={link.url} rel="noreferrer" target="_blank">
													<Button size="sm" variant="outline">
														<ExternalLink className="mr-1 h-3 w-3" />
														Open in Ariba
													</Button>
												</a>
												{link.downloadedDocUrl && (
													<a href={link.downloadedDocUrl} rel="noreferrer" target="_blank">
														<Button size="sm" variant="outline">
															<Download className="mr-1 h-3 w-3" />
															Doc
														</Button>
													</a>
												)}
											</div>
										))}
									</div>
								</div>
							</>
						)}

						{/* Email body */}
						<Separator />
						<div>
							<p className="text-muted-foreground mb-2 text-xs font-medium">Email Body</p>
							{sanitizedHtml ? (
								<div className="prose prose-sm max-w-none rounded-md border bg-white p-3" dangerouslySetInnerHTML={{ __html: htmlWithTargetBlank }} ref={htmlRef} />
							) : (
								<pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm">{email.textBody || "(empty)"}</pre>
							)}
						</div>

						{/* Action buttons */}
						<Separator />
						<div className="flex flex-wrap gap-2">
							{(email.classification.category === "NEW_RFQ" || email.source !== "UNKNOWN") && (
								<Button onClick={onCreateRfq} size="sm">
									<FileText className="mr-1 h-4 w-4" />
									Create RFQ
								</Button>
							)}
							<Button onClick={onLinkRfq} size="sm" variant="outline">
								Link to RFQ
							</Button>
						</div>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
};

export default EmailDetailSheet;
