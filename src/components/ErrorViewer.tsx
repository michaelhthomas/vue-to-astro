import { Component, Show } from "solid-js";

export const ErrorViewer: Component<{ error: unknown }> = (props) => {
	const errorMessage = () =>
		props.error instanceof Error ? props.error.message : String(props.error);
	const errorStack = () =>
		props.error instanceof Error ? props.error.stack : undefined;

	return (
		<div class="flex h-full flex-col gap-2 bg-red-300 p-6">
			<h1 class="text-xl font-bold text-red-900">An Error Occurred</h1>
			<h3 class="text-md font-semibold text-red-900">{errorMessage()}</h3>
			<Show when={errorStack()}>
				<pre class="min-h-0 overflow-scroll rounded bg-red-200 p-4 text-red-900">
					<code>{errorStack()}</code>
				</pre>
			</Show>
		</div>
	);
};
