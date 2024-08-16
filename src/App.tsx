import { createSignal, ErrorBoundary, type Component } from "solid-js";
import { MainLayout } from "./layouts/MainLayout";
import { CodeEditor } from "./components/CodeEditor";
import { AstroConverter } from "./components/AstroConverter";
import { ErrorViewer } from "./components/ErrorViewer";
import { makePersisted } from "@solid-primitives/storage";

const App: Component = () => {
	const [template, setTemplate] = makePersisted(createSignal(""));
	const [dragging, setDragging] = createSignal(false);
	const [lBoxWidth, setLBoxWidth] = createSignal<number>();

	const minBoxWidth = 25;
	const boxWidth = () => {
		const vertical = resizeType() === "x";
		const width = lBoxWidth();
		const mainWidth = vertical ? mainBox.clientWidth : mainBox.clientHeight;
		const offset = vertical ? mainBox.offsetLeft : mainBox.offsetTop;
		return width
			? Math.min(
					Math.max(((width - offset) / mainWidth) * 100, minBoxWidth),
					100 - minBoxWidth,
				)
			: undefined;
	};
	const leftBoxBasis = () => {
		const p = boxWidth();
		return p ? p + "%" : undefined;
	};
	const rightBoxBasis = () => {
		const p = boxWidth();
		return p ? 100 - p + "%" : undefined;
	};

	let mainBox: HTMLDivElement;
	let draggable: HTMLDivElement;

	const resizeType = () =>
		getComputedStyle(mainBox).flexDirection === "column" ? "y" : "x";

	return (
		<MainLayout title="Vue to Astro Converter">
			<div
				ref={mainBox!}
				class="flex h-full flex-col overflow-x-hidden md:flex-row"
			>
				<div
					class="flex min-h-0 min-w-0 flex-grow-0 basis-1/2 resize-x flex-col gap-2"
					style={{ "flex-basis": leftBoxBasis() }}
				>
					<CodeEditor
						language="vue"
						value={template()}
						onChange={setTemplate}
					/>
				</div>

				<div
					ref={draggable!}
					class="group z-10 -my-2 flex cursor-row-resize items-center py-2 md:-mx-2 md:my-0 md:cursor-col-resize md:flex-col md:px-2 md:py-0"
					data-grabbed={dragging() || undefined}
					onPointerDown={(e) => {
						e.preventDefault(); // stop regular drag behavior
						draggable.setPointerCapture(e.pointerId);
						setDragging(true);
					}}
					onPointerUp={(e) => {
						draggable.releasePointerCapture(e.pointerId);
						setDragging(false);
					}}
					onPointerMove={(e) => {
						if (!dragging()) return;
						setLBoxWidth(resizeType() === "x" ? e.clientX : e.clientY);
					}}
				>
					<div class="w-full border border-neutral-500 transition-colors group-data-[grabbed]:border-neutral-200 md:h-full" />
				</div>

				<div
					class="flex min-h-0 min-w-0 flex-grow basis-1/2 flex-col gap-2"
					style={{ "flex-basis": rightBoxBasis() }}
				>
					<ErrorBoundary fallback={(err) => <ErrorViewer error={err} />}>
						<AstroConverter template={template()} />
					</ErrorBoundary>
				</div>
			</div>
		</MainLayout>
	);
};

export default App;
