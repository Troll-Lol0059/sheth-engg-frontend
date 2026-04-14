"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { ExternalLink, FileArchive, FileImage, FileText, Paperclip } from "lucide-react";

interface RfqDrawingsSectionProps {
	drawings: RfqDrawing[];
}

function getFileIcon(filename: string) {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".pdf")) return <FileText className="h-4 w-4 text-red-500" />;
	if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".7z"))
		return <FileArchive className="h-4 w-4 text-yellow-500" />;
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".svg"))
		return <FileImage className="h-4 w-4 text-blue-500" />;
	return <Paperclip className="h-4 w-4 text-muted-foreground" />;
}

function getFileBadgeLabel(filename: string) {
	const lower = filename.toLowerCase();
	if (lower.endsWith(".pdf")) return "PDF";
	if (lower.endsWith(".zip")) return "ZIP";
	if (lower.endsWith(".rar")) return "RAR";
	if (lower.endsWith(".7z")) return "7Z";
	if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "JPG";
	if (lower.endsWith(".png")) return "PNG";
	const ext = filename.split(".").pop()?.toUpperCase();
	return ext ?? "FILE";
}

const RfqDrawingsSection = ({ drawings }: RfqDrawingsSectionProps) => {
	if (!drawings || drawings.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<Paperclip className="h-5 w-5" />
					Available Drawings
					<Badge className="ml-1" variant="secondary">
						{drawings.length}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{drawings.map((drawing, idx) => (
						<div
							key={idx}
							className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-2.5"
						>
							<div className="flex min-w-0 items-center gap-3">
								{getFileIcon(drawing.filename)}
								<span className="truncate text-sm font-medium">{drawing.filename}</span>
								<Badge variant="outline" className="shrink-0 text-[10px]">
									{getFileBadgeLabel(drawing.filename)}
								</Badge>
							</div>
							<Button
								onClick={() => window.open(drawing.url, "_blank", "noopener,noreferrer")}
								size="sm"
								variant="outline"
								className="ml-4 shrink-0"
							>
								<ExternalLink className="mr-2 h-3 w-3" />
								Open
							</Button>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};

export default RfqDrawingsSection;
