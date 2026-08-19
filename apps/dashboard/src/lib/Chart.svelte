<script lang="ts">
	import { Chart } from 'chart.js/auto';
	import type { ChartConfiguration } from 'chart.js';

	let { config }: { config: ChartConfiguration } = $props();

	let canvas: HTMLCanvasElement;

	$effect(() => {
		const chart = new Chart(canvas, config);

		return () => chart.destroy();
	});
</script>

<canvas bind:this={canvas}></canvas>
