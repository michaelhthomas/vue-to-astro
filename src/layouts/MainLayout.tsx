import { ParentComponent } from "solid-js";
import { RiLogosGithubFill } from "solid-icons/ri";

export const MainLayout: ParentComponent<{ title: string }> = (props) => {
	return (
		<div class="flex h-full flex-col">
			<div class="navbar bg-base-200">
				<a class="navbar-start px-4 text-xl font-semibold">{props.title}</a>

				<a
					class="navbar-end px-4"
					href="https://github.com/michaelhthomas/vue-to-astro"
					aria-label="Github Project"
					target="_blank"
				>
					<RiLogosGithubFill class="size-6" />
				</a>
			</div>

			<div class="min-h-0 w-full flex-grow">{props.children}</div>
		</div>
	);
};
