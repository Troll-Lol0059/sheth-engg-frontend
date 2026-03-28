"use client";

import { useEffect, useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { Loader2, Settings } from "lucide-react";

interface EmailSettingsDialogProps {
	open: boolean;
	onClose: () => void;
}

const EmailSettingsDialog = ({ open, onClose }: EmailSettingsDialogProps) => {
	const queryClient = useQueryClient();

	const { data: settings, isLoading } = useQuery<EmailSettings>({
		queryKey: ["email-settings"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/email/settings");
			return res?.data?.data;
		},
		enabled: open,
	});

	const [form, setForm] = useState({
		imapHost: "imap.gmail.com",
		imapPort: 993,
		imapUser: "",
		imapPassword: "",
		imapTls: true,
		syncEnabled: false,
		syncIntervalMinutes: 10,
		aribaUsername: "",
		aribaPassword: "",
		aribaAutoDownload: false,
	});

	useEffect(() => {
		if (settings) {
			setForm(prev => ({
				...prev,
				imapHost: settings.imapHost,
				imapPort: settings.imapPort,
				imapUser: settings.imapUser,
				imapTls: settings.imapTls,
				syncEnabled: settings.syncEnabled,
				syncIntervalMinutes: settings.syncIntervalMinutes,
				aribaUsername: settings.aribaUsername,
				aribaAutoDownload: settings.aribaAutoDownload,
			}));
		}
	}, [settings]);

	const update = (field: string, value: string | number | boolean) => setForm(prev => ({ ...prev, [field]: value }));

	const { mutate: save, isPending: saving } = useMutation({
		mutationFn: () => axios.put("/api/v1/email/settings", form),
		onSuccess: () => {
			toast.success("Settings saved");
			queryClient.invalidateQueries({ queryKey: ["email-settings"] });
			onClose();
		},
		onError: () => toast.error("Failed to save settings"),
	});

	const { mutate: testConn, isPending: testing } = useMutation({
		mutationFn: async () => {
			const res = await axios.post("/api/v1/email/settings/test-connection", {
				imapHost: form.imapHost,
				imapPort: form.imapPort,
				imapUser: form.imapUser,
				imapPassword: form.imapPassword || undefined,
				imapTls: form.imapTls,
			});
			return res?.data?.data;
		},
		onSuccess: data => toast.success(data?.message || "Connection successful"),
		onError: () => toast.error("Connection failed. Check credentials."),
	});

	if (isLoading) {
		return (
			<Dialog onOpenChange={v => !v && onClose()} open={open}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Email Settings</DialogTitle>
					</DialogHeader>
					<div className="flex justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin" />
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog onOpenChange={v => !v && onClose()} open={open}>
			<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						Email Settings
					</DialogTitle>
					<DialogDescription>Configure IMAP and Ariba integration settings.</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* IMAP */}
					<div>
						<h4 className="text-sm font-semibold">IMAP Configuration</h4>
						<p className="text-muted-foreground mb-3 text-xs">For Gmail: enable 2FA, then create an App Password.</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label className="text-xs">Host</Label>
							<Input onChange={e => update("imapHost", e.target.value)} value={form.imapHost} />
						</div>
						<div>
							<Label className="text-xs">Port</Label>
							<Input onChange={e => update("imapPort", Number(e.target.value))} type="number" value={form.imapPort} />
						</div>
					</div>

					<div>
						<Label className="text-xs">Email / Username</Label>
						<Input onChange={e => update("imapUser", e.target.value)} placeholder="user@gmail.com" value={form.imapUser} />
					</div>

					<div>
						<Label className="text-xs">Password (App Password)</Label>
						<Input
							onChange={e => update("imapPassword", e.target.value)}
							placeholder={settings?.hasImapPassword ? "••••••• (saved)" : "Enter app password"}
							type="password"
							value={form.imapPassword}
						/>
					</div>

					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-sm">
							<input checked={form.imapTls} onChange={e => update("imapTls", e.target.checked)} type="checkbox" />
							TLS
						</label>
						<label className="flex items-center gap-2 text-sm">
							<input checked={form.syncEnabled} onChange={e => update("syncEnabled", e.target.checked)} type="checkbox" />
							Auto-sync enabled
						</label>
					</div>

					<div>
						<Label className="text-xs">Sync interval (minutes)</Label>
						<Input max={60} min={5} onChange={e => update("syncIntervalMinutes", Number(e.target.value))} type="number" value={form.syncIntervalMinutes} />
					</div>

					<Button className="w-full" disabled={testing} onClick={() => testConn()} variant="outline">
						{testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
						Test IMAP Connection
					</Button>

					<Separator />

					{/* Ariba */}
					<div>
						<h4 className="text-sm font-semibold">Ariba Integration</h4>
						<p className="text-muted-foreground mb-3 text-xs">Optional. Configure for automatic document download from SAP Ariba.</p>
					</div>

					<div>
						<Label className="text-xs">Ariba Username</Label>
						<Input onChange={e => update("aribaUsername", e.target.value)} placeholder="shethengg@gmail.com" value={form.aribaUsername} />
					</div>

					<div>
						<Label className="text-xs">Ariba Password</Label>
						<Input
							onChange={e => update("aribaPassword", e.target.value)}
							placeholder={settings?.hasAribaPassword ? "••••••• (saved)" : "Enter password"}
							type="password"
							value={form.aribaPassword}
						/>
					</div>

					<label className="flex items-center gap-2 text-sm">
						<input checked={form.aribaAutoDownload} onChange={e => update("aribaAutoDownload", e.target.checked)} type="checkbox" />
						Enable auto-download (Puppeteer mode)
					</label>
					{form.aribaAutoDownload && (
						<p className="text-muted-foreground text-xs">Requires Puppeteer installed on server. Uses ~300-400MB RAM. Falls back to link-only on failure.</p>
					)}

					<Separator />

					<div className="flex justify-end gap-2">
						<Button onClick={onClose} variant="outline">Cancel</Button>
						<Button disabled={saving} onClick={() => save()}>
							{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
							Save Settings
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default EmailSettingsDialog;
