"use client";
import { Button } from "@components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface RevisedOptionsProps {
	rfq: Rfq;
}

const RevisedOptions = ({ rfq }: RevisedOptionsProps) => {
	const router = useRouter();

	return (
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
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default RevisedOptions;
