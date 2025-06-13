"use client";
import { cn } from "@lib/utils";
import { toast } from "./toaster";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { forwardRef, useState } from "react";
import { File, Upload, X } from "lucide-react";
import { formatBytes } from "@lib/formatBytes";
import Dropzone, { DropzoneProps, FileRejection } from "react-dropzone";

interface FileInputProps extends Omit<DropzoneProps, "multiple"> {
	className?: string;
	onChange?: (files: File[]) => void;
	value?: File[];
}

const FileInput = forwardRef<HTMLDivElement, FileInputProps>(({ accept, disabled, maxFiles = 1, maxSize = 1024 * 1024 * 2, onChange, value, className, ...props }, ref) => {
	const [files, setFiles] = useState<File[]>(value || []);

	const onDrop = async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
		if (rejectedFiles.length > maxFiles) {
			toast.error("Error!", { description: `Cannot select more than ${maxFiles} ${maxFiles > 1 ? "files" : "file"}!` });
			return;
		}
		if (files.length + acceptedFiles.length > maxFiles) {
			toast.error("Error!", { description: `Cannot select more than ${maxFiles} ${maxFiles > 1 ? "files" : "file"}!` });
			return;
		}
		if (rejectedFiles.length > 0) {
			rejectedFiles.forEach(({ file }) => {
				toast.error("Error!", { description: `Cannot select ${file.name}!` });
			});
		}
		if (acceptedFiles.length > 0) {
			const newFiles = [...files, ...acceptedFiles];
			setFiles(newFiles);
			if (onChange) {
				await onChange(newFiles);
			}
		}
	};

	const onRemove = async (index: number) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		setFiles(newFiles);
		if (onChange) {
			await onChange(newFiles);
		}
	};

	return (
		<div className="relative flex flex-col gap-6 overflow-hidden p-1" ref={ref}>
			<Dropzone accept={accept} disabled={disabled} maxFiles={maxFiles} maxSize={maxSize} multiple={maxFiles > 1} onDrop={onDrop} {...props}>
				{({ getRootProps, getInputProps, isDragActive }) => (
					<div
						className={cn(
							"flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border bg-input px-3 py-2 text-center outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
							disabled && "cursor-not-allowed opacity-50",
							className
						)}
						{...getRootProps()}
					>
						<input {...getInputProps()} />
						<Upload aria-hidden="true" size={32} />
						<div className="flex w-full flex-col items-center justify-center gap-2">
							<h1 className="text-sm font-medium text-foreground">
								{isDragActive ? `Drop your ${maxFiles > 1 ? "files" : "file"} here` : `Drop your ${maxFiles > 1 ? "files" : "file"} here or click to select your ${maxFiles > 1 ? "files" : "file"}`}
							</h1>
							<p className="text-xs text-muted-foreground sm:text-sm">
								You can upload {maxFiles > 1 ? `${maxFiles === Infinity ? "multiple" : maxFiles} files (up to ${formatBytes(maxSize)} each)` : ` a file up to ${formatBytes(maxSize)}`}
							</p>
						</div>
					</div>
				)}
			</Dropzone>
			{files?.length ? (
				<ScrollArea className="h-fit w-full px-3">
					<div className="max-h-40 space-y-4">
						{files?.map((file, index) => (
							<div className="relative flex w-full items-center justify-between gap-2" key={index}>
								<File size={36} />
								<div className="flex w-full flex-col justify-center">
									<h4 className="text-sm font-medium text-foreground">{file.name}</h4>
									<p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
								</div>
								<Button className="sticky inset-y-0 right-0 shrink-0 bg-background" onClick={() => onRemove(index)} size="icon" variant="ghost">
									<X />
								</Button>
							</div>
						))}
					</div>
				</ScrollArea>
			) : null}
		</div>
	);
});

FileInput.displayName = "FileInput";

export { FileInput };
