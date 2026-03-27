"use client";
import Link from "next/link";
import Image from "next/image";
import { logo } from "@assets";
import MenuItem from "./menu-item";
import { LogOut } from "lucide-react";
import { Button } from "@components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { APP_DESCRIPTION, APP_NAME } from "@data";
import { ScrollArea } from "@components/ui/scroll-area";
import CollapsibleMenuItem from "./collapsible-menu-item";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@components/ui/sheet";

type SidebarSheetProps = {
	openSheet: boolean;
	setOpenSheet: Dispatch<SetStateAction<boolean>>;
	isPending: boolean;
	onLogout: () => void;
	items: MenuItem[];
};

const SidebarSheet = ({ openSheet, setOpenSheet, isPending = false, onLogout, items }: SidebarSheetProps) => {
	return (
		<Sheet open={openSheet} onOpenChange={setOpenSheet}>
			<SheetContent side="left" className="flex h-full w-full max-w-72 flex-col justify-between">
				<SheetHeader>
					<SheetTitle asChild>
						<Button className="mt-2" size="default" variant="ghost" asChild>
							<Link href="/">
								<Image alt={APP_NAME} src={logo} width={160} height={40} priority />
							</Link>
						</Button>
					</SheetTitle>
					<SheetDescription className="hidden">{APP_DESCRIPTION}</SheetDescription>
				</SheetHeader>
				<ScrollArea className="flex w-full flex-col items-center justify-center gap-2">
					<ul className="flex w-full flex-col items-center justify-center gap-1">
						{items?.map((item: MenuItem) => (
							<li className="flex w-full items-center justify-center gap-1" key={item?.uuid}>
								{item?.submenus?.length ? <CollapsibleMenuItem menuItem={item} /> : <MenuItem menuItem={item} />}
							</li>
						))}
					</ul>
				</ScrollArea>
				<Button size="default" variant="ghost" disabled={isPending} onClick={onLogout}>
					<LogOut />
					Logout
				</Button>
			</SheetContent>
		</Sheet>
	);
};

export default SidebarSheet;
