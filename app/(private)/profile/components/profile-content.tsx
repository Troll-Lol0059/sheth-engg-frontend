"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@config/axios";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { User } from "lucide-react";
import ModuleHelp from "@components/common/module-help";
import { profileHelp } from "@data/helpData";
import { UpdateProfileSchema, ChangePasswordSchema, UpdateProfileFormValues, ChangePasswordFormValues } from "@schemas/profile";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import usePasswordToggle from "@hooks/usePasswordToggle";
import useSession from "@store/session";

interface ProfileContentProps {
	initialData: Record<string, string> | null;
}

const ProfileContent = ({ initialData }: ProfileContentProps) => {
	const queryClient = useQueryClient();
	const { setSession } = useSession();

	const { data: profileData } = useQuery({
		queryKey: ["user-profile"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/user/profile");
			return res?.data?.data;
		},
		initialData: initialData ?? undefined,
	});

	const profileForm = useForm<UpdateProfileFormValues>({
		resolver: zodResolver(UpdateProfileSchema),
		defaultValues: {
			firstName: initialData?.firstName ?? "",
			middleName: initialData?.middleName ?? "",
			lastName: initialData?.lastName ?? "",
			phoneNumber: initialData?.phoneNumber ?? "",
		},
	});

	const passwordForm = useForm<ChangePasswordFormValues>({
		resolver: zodResolver(ChangePasswordSchema),
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const oldPasswordToggle = usePasswordToggle();
	const newPasswordToggle = usePasswordToggle();
	const confirmPasswordToggle = usePasswordToggle();

	const updateProfileMutation = useMutation({
		mutationFn: async (data: UpdateProfileFormValues) => {
			const response = await axios.patch("/api/v1/user/profile", data);
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Profile updated successfully!");
			queryClient.invalidateQueries({ queryKey: ["user-profile"] });
			const user = profileData as Record<string, string> | undefined;
			setSession({
				uuid: profileData?._id ?? null,
				avatarUrl: null,
				name: user?.userName ?? user?.firstName ?? null,
				email: user?.email ?? null,
				contactNo: user?.phoneNumber ?? null,
				roles: user?.role ? [user.role] : [],
			});
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to update profile");
		},
	});

	const changePasswordMutation = useMutation({
		mutationFn: async (data: ChangePasswordFormValues) => {
			const response = await axios.patch("/api/v1/user/change-password", {
				oldPassword: data.oldPassword,
				newPassword: data.newPassword,
			});
			return response?.data;
		},
		onSuccess: () => {
			toast.success("Password changed successfully!");
			passwordForm.reset();
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error(errorData?.message ?? "Failed to change password");
		},
	});

	const onProfileSubmit = (data: UpdateProfileFormValues) => {
		updateProfileMutation.mutate(data);
	};

	const onPasswordSubmit = (data: ChangePasswordFormValues) => {
		changePasswordMutation.mutate(data);
	};

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<User className="h-7 w-7" />
					<h1 className="text-2xl font-semibold">My Profile</h1>
				</div>
				<ModuleHelp description="Guide to managing your profile" sections={profileHelp} title="My Profile — Help" />
			</div>

			{/* Profile Details Card */}
			<Card>
				<CardHeader>
					<CardTitle>Profile Details</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...profileForm}>
						<form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{/* Read-only fields */}
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium">Email</label>
									<Input value={profileData?.email ?? ""} disabled />
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium">Username</label>
									<Input value={profileData?.userName ?? ""} disabled />
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-sm font-medium">Role</label>
									<div>
										<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{profileData?.role ?? "N/A"}</span>
									</div>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={profileForm.control}
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter first name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={profileForm.control}
									name="middleName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Middle Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter middle name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={profileForm.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter last name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={profileForm.control}
									name="phoneNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone Number</FormLabel>
											<FormControl>
												<Input placeholder="Enter phone number" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end">
								<Button type="submit" disabled={updateProfileMutation.isPending}>
									{updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>

			{/* Change Password Card */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...passwordForm}>
						<form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={passwordForm.control}
									name="oldPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Old Password</FormLabel>
											<FormControl>
												<div className="relative flex items-center">
													<Input type={oldPasswordToggle.inputType} placeholder="Enter old password" className="peer pr-10" {...field} />
													<span className="absolute right-3">{oldPasswordToggle.inputIcon}</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={passwordForm.control}
									name="newPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>New Password</FormLabel>
											<FormControl>
												<div className="relative flex items-center">
													<Input type={newPasswordToggle.inputType} placeholder="Enter new password" className="peer pr-10" {...field} />
													<span className="absolute right-3">{newPasswordToggle.inputIcon}</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={passwordForm.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Confirm Password</FormLabel>
											<FormControl>
												<div className="relative flex items-center">
													<Input type={confirmPasswordToggle.inputType} placeholder="Confirm new password" className="peer pr-10" {...field} />
													<span className="absolute right-3">{confirmPasswordToggle.inputIcon}</span>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end">
								<Button type="submit" disabled={changePasswordMutation.isPending}>
									{changePasswordMutation.isPending ? "Changing..." : "Change Password"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
};

export default ProfileContent;
