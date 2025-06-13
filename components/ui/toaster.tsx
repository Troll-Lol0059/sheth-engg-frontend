"use client";
import { Toaster as Sonner, toast } from "sonner";
import { CircleAlert, CircleCheck, CircleHelp, CircleX, LoaderCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			icons={{
				error: <CircleX />,
				info: <CircleHelp />,
				loading: <LoaderCircle className="animate-spin" />,
				success: <CircleCheck />,
				warning: <CircleAlert />,
			}}
			richColors
			theme="light"
			{...props}
		/>
	);
};

export { Toaster, toast };
