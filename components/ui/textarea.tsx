import { cn } from "@lib/utils";
import { ReactNode, TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	endContent?: ReactNode;
	startContent?: ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, endContent, startContent, ...props }, ref) => {
	return (
		<div
			className={cn(
				"flex h-24 w-full justify-center gap-2 rounded-xl border border-border bg-input px-3 py-2 ring-offset-background has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2",
				className
			)}
		>
			{startContent}
			<textarea className="peer flex h-full w-full resize-none self-center bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" ref={ref} {...props} />
			{endContent}
		</div>
	);
});
Textarea.displayName = "Textarea";

export { Textarea };
