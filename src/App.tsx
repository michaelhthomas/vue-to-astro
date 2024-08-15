import { createSignal, ErrorBoundary, type Component } from "solid-js";
import { MainLayout } from "./layouts/MainLayout";
import { CodeEditor } from "./components/CodeEditor";
import { AstroConverter } from "./components/AstroConverter";
import { ErrorViewer } from "./components/ErrorViewer";
import { makePersisted } from "@solid-primitives/storage";

const App: Component = () => {
	const [template, setTemplate] = makePersisted(createSignal(""));

	return (
		<MainLayout title="Vue to Astro Converter">
			<div class="flex flex-shrink-0 flex-grow-0 basis-1/2 flex-col gap-2">
				<CodeEditor language="vue" value={template()} onChange={setTemplate} />
			</div>

			<div class="flex min-h-0 min-w-0 flex-shrink-0 flex-grow-0 basis-1/2 flex-col gap-2">
				<ErrorBoundary fallback={(err) => <ErrorViewer error={err} />}>
					<AstroConverter template={template()} />
				</ErrorBoundary>
			</div>
		</MainLayout>
	);
};

export default App;
