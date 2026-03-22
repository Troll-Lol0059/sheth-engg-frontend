"use client";
import { useState } from "react";
import { Button } from "@components/ui/button";
import { Eye, MoreHorizontal, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import DeleteRfqDialog from "./delete-rfq-dialog";
import { useRouter } from "next/navigation";

interface OptionsProps {
	rfq: Rfq;
}

const Options = ({ rfq }: OptionsProps) => {
	const router = useRouter();
	const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

	return (
		<>
			<DeleteRfqDialog openDialog={openDeleteDialog} rfq={rfq} setOpenDialog={setOpenDeleteDialog} />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="h-8 w-8 p-0" variant="ghost">
						<span className="sr-only">Open menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem className="gap-2" onClick={() => router.push(`/RFQ/view?rfqId=${rfq._id}`)}>
						<Eye className="h-4 w-4" />
						View Details
					</DropdownMenuItem>
					<DropdownMenuItem className="gap-2 text-destructive" onClick={() => setOpenDeleteDialog(true)}>
						<Trash className="h-4 w-4" />
						Delete RFQ
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};

export default Options;
