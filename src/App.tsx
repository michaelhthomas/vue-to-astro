import { createSignal, type Component } from "solid-js";
import { MainLayout } from "./layouts/MainLayout";

const App: Component = () => {
	const [template, setTemplate] = createSignal<string>();

	return (
		<MainLayout title="Vue to Astro Converter">
			<div class="flex flex-shrink-0 flex-grow-0 basis-1/2 flex-col gap-2">
				<textarea
					class="w-full flex-grow resize-none p-2"
					onInput={(e) => setTemplate(e.target.value)}
				/>
			</div>

			<div class="flex min-h-0 min-w-0 flex-shrink-0 flex-grow-0 basis-1/2 flex-col gap-2">
				<div class="min-h-0 flex-grow">{template()}</div>
			</div>
		</MainLayout>
	);
};

export default App;
