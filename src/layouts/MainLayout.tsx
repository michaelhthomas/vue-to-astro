import { ParentComponent } from "solid-js";

export const MainLayout: ParentComponent<{ title: string }> = (props) => {
	return (
		<div class="flex h-full flex-col">
			<div class="navbar bg-base-200">
				<a class="px-4 text-xl font-semibold">{props.title}</a>
			</div>

			<div class="min-h-0 w-full flex-grow">{props.children}</div>
		</div>
	);
};
