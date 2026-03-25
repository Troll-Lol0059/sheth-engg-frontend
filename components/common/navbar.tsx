"use client";
import { useState } from "react";
import axios from "@config/axios";
import { AxiosError } from "axios";
import useSession from "@store/session";
import { Menu } from "lucide-react";
import SidebarSheet from "./sidebar-sheet";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { toast } from "@components/ui/toaster";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@components/ui/navigation-menu";

type NavbarProps = {
	menuItemsData: MenuItem[];
};

const Navbar = ({ menuItemsData }: NavbarProps) => {
	const router = useRouter();
	const { session, setSession } = useSession();
	const [onLogoutToast, setOnLogoutToast] = useState<string | number>();
	const [openSidebarSheet, setOpenSidebarSheet] = useState<boolean>(false);

	async function onLogout() {
		setOnLogoutToast(toast.loading("Loading...", { description: "Please wait while we logout you!" }));
		await axios.post("/api/v1/user/logout");
	}

	const { mutate, isPending } = useMutation({
		mutationFn: onLogout,
		onSuccess: () => {
			toast.success("Success!", { id: onLogoutToast, description: "You've successfully logged out!" });
			router.replace("/auth/login");
			setSession(null);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error("Error!", { id: onLogoutToast, description: errorData?.message || "An error occured!" });
		},
	});

	return (
		<>
			<SidebarSheet openSheet={openSidebarSheet} setOpenSheet={setOpenSidebarSheet} isPending={isPending} onLogout={mutate} items={menuItemsData} />
			<nav className="bg-background sticky inset-x-0 top-0 z-10 flex h-16 w-full items-center justify-between p-4 lg:justify-end">
				<Button className="lg:hidden" onClick={() => setOpenSidebarSheet(!openSidebarSheet)} size="icon" variant="ghost">
					<Menu />
				</Button>
				<NavigationMenu>
					<NavigationMenuList>
						<NavigationMenuItem>
							<p className="xs:block hidden">{`Hi ${session?.name ?? "User"}`}</p>
						</NavigationMenuItem>
						<NavigationMenuItem>
							{/* <Notifications openNotificationsDialog={openNotificationsDialog} pushNotifications={notifications} setOpenNotificationsDialog={setOpenNotificationsDialog}>
								<Button size="icon" variant="ghost">
									<div className="relative flex size-8 items-center justify-center">
										<span className="sr-only">Open menu</span>
										<Bell size={20} />
										{unreadNotificationCount > 0 && <span className="bg-destructive text-destructive-foreground absolute top-0 right-0 rounded-full px-2 text-xs font-medium">{unreadCount}</span>}
									</div>
								</Button>
							</Notifications> */}
						</NavigationMenuItem>
						<NavigationMenuItem>
							<Avatar>
								{session?.avatarUrl && <AvatarImage alt="profile" className="object-cover" src={session.avatarUrl} />}
								<AvatarFallback>{session?.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
							</Avatar>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</nav>
		</>
	);
};

export default Navbar;
