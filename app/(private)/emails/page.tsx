import EmailTable from "./components/email-table";

const EmailsPage = () => {
	return (
		<section className="flex h-full min-h-[calc(100vh-4rem)] w-full flex-col gap-4 overflow-auto p-5">
			<div>
				<h1 className="text-2xl font-bold">Emails</h1>
				<p className="text-muted-foreground text-sm">AI-classified procurement emails — RFQs, POs, reminders, and more</p>
			</div>
			<EmailTable />
		</section>
	);
};

export default EmailsPage;
