"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CompanyProfileSchema, CompanyProfileFormValues } from "@schemas/companyProfile";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Badge } from "@components/ui/badge";
import { Loader2, Building2, Upload, Save, Image } from "lucide-react";

interface CompanyProfile {
	_id: string;
	name: string;
	tagline: string;
	gstin: string;
	vendorCode: string;
	addressLine1: string;
	addressLine2: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
	phone: string;
	email: string;
	contactPersonName: string;
	contactPersonEmail: string;
	logoUrl: string;
}

type CompanyProfileFormProps = {
	initialData: CompanyProfile | null;
};

const CompanyProfileForm = ({ initialData }: CompanyProfileFormProps) => {
	const queryClient = useQueryClient();

	const { data: profileData } = useQuery<CompanyProfile>({
		queryKey: ["company-profile"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/company-profile");
			return res?.data?.data;
		},
		initialData: initialData ?? undefined,
	});

	const form = useForm<CompanyProfileFormValues>({
		resolver: zodResolver(CompanyProfileSchema),
		defaultValues: {
			name: initialData?.name ?? "",
			tagline: initialData?.tagline ?? "",
			gstin: initialData?.gstin ?? "",
			vendorCode: initialData?.vendorCode ?? "",
			addressLine1: initialData?.addressLine1 ?? "",
			addressLine2: initialData?.addressLine2 ?? "",
			city: initialData?.city ?? "",
			state: initialData?.state ?? "",
			pincode: initialData?.pincode ?? "",
			country: initialData?.country ?? "",
			phone: initialData?.phone ?? "",
			email: initialData?.email ?? "",
			contactPersonName: initialData?.contactPersonName ?? "",
			contactPersonEmail: initialData?.contactPersonEmail ?? "",
		},
		mode: "onTouched",
	});

	const { mutate: saveProfile, isPending: isSaving } = useMutation({
		mutationFn: async (values: CompanyProfileFormValues) => {
			const res = await axios.put("/api/v1/company-profile", values);
			return res?.data?.data;
		},
		onSuccess: () => {
			toast.success("Company profile updated");
			queryClient.invalidateQueries({ queryKey: ["company-profile"] });
		},
		onError: () => toast.error("Failed to update profile"),
	});

	const [uploading, setUploading] = useState(false);

	const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const maxSize = 2 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error("Logo file must be under 2MB");
			return;
		}

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("logo", file);
			await axios.post("/api/v1/company-profile/logo", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.success("Logo uploaded successfully");
			queryClient.invalidateQueries({ queryKey: ["company-profile"] });
		} catch {
			toast.error("Failed to upload logo");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-6">
			<div className="flex items-center gap-3">
				<Building2 className="h-6 w-6" />
				<h1 className="text-2xl font-bold">Company Profile</h1>
				<Badge variant="outline" className="text-xs">
					Used in all PDF &amp; Excel templates
				</Badge>
			</div>

			{/* Logo Section */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Company Logo</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-6">
						{profileData?.logoUrl ? (
							<div className="flex h-24 w-48 items-center justify-center overflow-hidden rounded-lg border bg-white p-2">
								<img src={profileData.logoUrl} alt="Company Logo" className="max-h-full max-w-full object-contain" />
							</div>
						) : (
							<div className="text-muted-foreground flex h-24 w-48 items-center justify-center rounded-lg border border-dashed">
								<Image className="mr-2 h-5 w-5" />
								No logo
							</div>
						)}
						<div className="space-y-2">
							<label htmlFor="logo-upload">
								<Button asChild disabled={uploading} size="sm" variant="outline">
									<span>
										{uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
										{uploading ? "Uploading..." : "Upload Logo"}
									</span>
								</Button>
							</label>
							<input accept="image/png,image/jpeg,image/svg+xml" className="hidden" id="logo-upload" onChange={handleLogoUpload} type="file" />
							<p className="text-muted-foreground text-xs">PNG, JPG, or SVG. Max 2MB. Recommended: 400x100px</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Details Form */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Company Details</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(values => saveProfile(values))} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>
												Company Name <span className="text-destructive">*</span>
											</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Sheth Engineering" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="tagline"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>Tagline</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Precision Engineering & Manufacturing Solutions" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="gstin"
									render={({ field }) => (
										<FormItem>
											<FormLabel>GSTIN</FormLabel>
											<FormControl>
												<Input placeholder="e.g. 24AABCS1234F1ZP" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="vendorCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Vendor Code</FormLabel>
											<FormControl>
												<Input placeholder="e.g. SE-2024-001" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="addressLine1"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>Address Line 1</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Plot No. 123, Industrial Area" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="addressLine2"
									render={({ field }) => (
										<FormItem className="col-span-2">
											<FormLabel>Address Line 2</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Phase-II, Near Highway" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Ahmedabad" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem>
											<FormLabel>State</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Gujarat" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="pincode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Pincode</FormLabel>
											<FormControl>
												<Input placeholder="e.g. 382445" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="country"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Country</FormLabel>
											<FormControl>
												<Input placeholder="e.g. India" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="phone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone</FormLabel>
											<FormControl>
												<Input placeholder="+91 79 2583 XXXX" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input placeholder="info@company.com" type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contactPersonName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contact Person Name</FormLabel>
											<FormControl>
												<Input placeholder="e.g. John Doe" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contactPersonEmail"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contact Person Email</FormLabel>
											<FormControl>
												<Input placeholder="e.g. john@company.com" type="email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end pt-2">
								<Button type="submit" disabled={isSaving}>
									{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
									{isSaving ? "Saving..." : "Save Changes"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
};

export default CompanyProfileForm;
