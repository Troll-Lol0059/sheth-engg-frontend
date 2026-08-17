"use client";

import { useEffect, useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Loader2, Server, Globe, Save, PlugZap, Shield, Plus, X } from "lucide-react";

const DEFAULT_WHITELIST = ["@jsw.in", "@ariba.com", "@ansmtp.ariba.com", "@timken.com", "@jindalsteel.com", "@jindalstainless.com", "@jswgbs.com", "@jsw.co.in"];

const EmailSettingsPage = () => {
	const queryClient = useQueryClient();

	const { data: settings, isLoading } = useQuery<EmailSettings>({
		queryKey: ["email-settings"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/email/settings");
			return res?.data?.data;
		},
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
		senderWhitelist: [] as string[],
		autoGmailDraftEnabled: false,
		autoCreateRfqEnabled: false,
	});

	const [newWhitelist, setNewWhitelist] = useState("");

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
				senderWhitelist: settings.senderWhitelist || [],
				autoGmailDraftEnabled: settings.autoGmailDraftEnabled,
				autoCreateRfqEnabled: settings.autoCreateRfqEnabled,
			}));
		}
	}, [settings]);

	const update = (field: string, value: string | number | boolean) => setForm(prev => ({ ...prev, [field]: value }));

	const addWhitelist = () => {
		const val = newWhitelist.trim().toLowerCase();
		if (!val) return;
		if (DEFAULT_WHITELIST.includes(val) || form.senderWhitelist.includes(val)) {
			toast.error("Already in the list");
			return;
		}
		setForm(prev => ({ ...prev, senderWhitelist: [...prev.senderWhitelist, val] }));
		setNewWhitelist("");
	};

	const removeWhitelist = (item: string) => {
		setForm(prev => ({ ...prev, senderWhitelist: prev.senderWhitelist.filter(w => w !== item) }));
	};

	const { mutate: save, isPending: saving } = useMutation({
		mutationFn: () => axios.put("/api/v1/email/settings", form),
		onSuccess: () => {
			toast.success("Email settings saved");
			queryClient.invalidateQueries({ queryKey: ["email-settings"] });
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
			<div className="flex items-center justify-center py-20">
				<Loader2 className="text-primary h-6 w-6 animate-spin" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">Email Settings</h2>
				<p className="text-muted-foreground text-sm">Configure IMAP email sync, sender filtering, and Ariba integration.</p>
			</div>

			{/* IMAP Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Server className="h-4 w-4" />
						IMAP Configuration
					</CardTitle>
					<CardDescription>For Gmail: enable 2-Step Verification, then create an App Password.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
						<Input onChange={e => update("imapPassword", e.target.value)} placeholder={settings?.hasImapPassword ? "••••••• (saved)" : "Enter app password"} type="password" value={form.imapPassword} />
					</div>

					<div className="flex flex-wrap items-center gap-4">
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
						{testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
						Test IMAP Connection
					</Button>
				</CardContent>
			</Card>

			{/* Sender Whitelist */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Shield className="h-4 w-4" />
						Sender Whitelist
					</CardTitle>
					<CardDescription>Only emails from these domains/addresses are synced. Others are ignored.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label className="text-muted-foreground mb-2 block text-xs">Default (always active)</Label>
						<div className="flex flex-wrap gap-1.5">
							{DEFAULT_WHITELIST.map(d => (
								<Badge key={d} variant="secondary">{d}</Badge>
							))}
						</div>
					</div>

					{form.senderWhitelist.length > 0 && (
						<div>
							<Label className="text-muted-foreground mb-2 block text-xs">Custom</Label>
							<div className="flex flex-wrap gap-1.5">
								{form.senderWhitelist.map(w => (
									<Badge className="gap-1 pr-1" key={w} variant="outline">
										{w}
										<button className="hover:text-destructive ml-0.5 rounded-sm p-0.5" onClick={() => removeWhitelist(w)} type="button">
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						</div>
					)}

					<div className="flex gap-2">
						<Input
							className="flex-1"
							onChange={e => setNewWhitelist(e.target.value)}
							onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addWhitelist())}
							placeholder="@domain.com or user@example.com"
							value={newWhitelist}
						/>
						<Button onClick={addWhitelist} size="sm" type="button" variant="outline">
							<Plus className="mr-1 h-4 w-4" />
							Add
						</Button>
					</div>
					<p className="text-muted-foreground text-xs">Use @domain.com to allow all emails from that domain, or a full address for a specific sender.</p>
				</CardContent>
			</Card>

			{/* Ariba Integration */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Globe className="h-4 w-4" />
						Ariba Integration
					</CardTitle>
					<CardDescription>Optional. Configure for automatic document download from SAP Ariba.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label className="text-xs">Ariba Username</Label>
						<Input onChange={e => update("aribaUsername", e.target.value)} placeholder="shethengg@gmail.com" value={form.aribaUsername} />
					</div>

					<div>
						<Label className="text-xs">Ariba Password</Label>
						<Input onChange={e => update("aribaPassword", e.target.value)} placeholder={settings?.hasAribaPassword ? "••••••• (saved)" : "Enter password"} type="password" value={form.aribaPassword} />
					</div>

					<label className="flex items-center gap-2 text-sm">
						<input checked={form.aribaAutoDownload} onChange={e => update("aribaAutoDownload", e.target.checked)} type="checkbox" />
						Enable auto-download (Puppeteer mode)
					</label>
					{form.aribaAutoDownload && <p className="text-muted-foreground text-xs">Requires Puppeteer installed on server. Uses ~300-400MB RAM. Falls back to link-only on failure.</p>}
				</CardContent>
			</Card>

			{/* Dispatch Status Auto-Draft */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Dispatch Status Auto-Draft</CardTitle>
					<CardDescription>
						When enabled, a Gmail draft is created automatically (never sent) for dispatch-status emails, but only for POs/items that have
						actually been dispatched. When disabled, nothing is checked and no drafts are created.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<label className="flex items-center gap-2 text-sm">
						<input checked={form.autoGmailDraftEnabled} onChange={e => update("autoGmailDraftEnabled", e.target.checked)} type="checkbox" />
						Auto-create Gmail drafts for dispatch status emails
					</label>
				</CardContent>
			</Card>

			{/* RFQ Auto-Creation */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">RFQ Auto-Creation</CardTitle>
					<CardDescription>
						When enabled, downloaded Ariba documents are automatically extracted and turned into PREVIEW-status RFQs. Off by default —
						create RFQs manually from the RFQ module instead.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<label className="flex items-center gap-2 text-sm">
						<input checked={form.autoCreateRfqEnabled} onChange={e => update("autoCreateRfqEnabled", e.target.checked)} type="checkbox" />
						Auto-create RFQs from downloaded Ariba documents
					</label>
				</CardContent>
			</Card>

			{/* Save */}
			<div className="flex justify-end">
				<Button disabled={saving} onClick={() => save()}>
					{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
					Save Settings
				</Button>
			</div>
		</div>
	);
};

export default EmailSettingsPage;
