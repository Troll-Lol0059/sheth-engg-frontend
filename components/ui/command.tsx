"use client";
import { cn } from "@lib/utils";
import { Search } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { ComponentPropsWithoutRef, ComponentRef, HTMLAttributes, Ref } from "react";

const Command = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive>>;
}) => <CommandPrimitive ref={ref} className={cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-xl", className)} {...props} />;
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
	return (
		<Dialog {...props}>
			<DialogContent className="overflow-hidden p-0 shadow-xs">
				<Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
};

const CommandInput = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.Input>>;
}) => (
	<div className="flex items-center border-b px-3" cmdk-input-wrapper="">
		<Search className="mr-2 size-4 shrink-0 opacity-50" />
		<CommandPrimitive.Input ref={ref} className={cn("placeholder:text-muted-foreground flex h-12 w-full rounded-xl bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
	</div>
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.List> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.List>>;
}) => <CommandPrimitive.List ref={ref} className={cn("max-h-80 overflow-x-hidden overflow-y-auto", className)} {...props} />;

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
	ref,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.Empty>>;
}) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />;

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.Group>>;
}) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			"text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
			className
		)}
		{...props}
	/>
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.Separator>>;
}) => <CommandPrimitive.Separator ref={ref} className={cn("bg-border -mx-1 h-px", className)} {...props} />;
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = ({
	ref,
	className,
	...props
}: ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
	ref?: Ref<ComponentRef<typeof CommandPrimitive.Item>>;
}) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			"aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xl px-2 py-1.5 text-sm outline-hidden select-none data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50",
			className
		)}
		{...props}
	/>
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => {
	return <span className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)} {...props} />;
};
CommandShortcut.displayName = "CommandShortcut";

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator };
