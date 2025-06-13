import { cn } from "@lib/utils";
import { forwardRef, HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("flex gap-1 shrink-0 items-center rounded-full border px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: {
		variant: {
			default: "border-transparent bg-primary/20 text-primary hover:bg-primary/30",
			secondary: "border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30",
			success: "border-transparent bg-success/20 text-success hover:bg-success/30",
			warning: "border-transparent bg-warning/20 text-warning hover:bg-warning/30",
			destructive: "border-transparent bg-destructive/20 text-destructive hover:bg-destructive/30",
			outline: "text-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
	return <div className={cn(badgeVariants({ variant }), className)} ref={ref} {...props} />;
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
