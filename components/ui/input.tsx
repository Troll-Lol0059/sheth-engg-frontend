import { cn } from "@lib/utils";
import { InputHTMLAttributes, ReactNode, forwardRef } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
	endContent?: ReactNode;
	type?: "email" | "number" | "password" | "search" | "tel" | "text" | "time" | "url";
	startContent?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, endContent, startContent, type, ...props }, ref) => {
	return (
		<div
			className={cn(
				"flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-input px-3 py-2 ring-offset-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2",
				className
			)}
		>
			{startContent}
			<input className="peer flex w-full items-center bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" ref={ref} type={type} {...props} />
			{endContent}
		</div>
	);
});

Input.displayName = "Input";

export { Input };
