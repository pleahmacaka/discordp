<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { ChartConfiguration } from 'chart.js';
	import Chart from '$lib/Chart.svelte';

	let { data } = $props();

	const day = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Seoul',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});

	const total = $derived(data.rows.reduce((sum, row) => sum + row.count, 0));
	const failed = $derived(data.rows.reduce((sum, row) => sum + row.failed, 0));
	const daily = $derived([...data.daily].reverse());

	function themeColor(name: string, fallback: string): string {
		if (typeof document === 'undefined') return fallback;

		return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
	}

	const primary = $derived(themeColor('--color-primary', '#2a78d6'));
	const error = $derived(themeColor('--color-error', '#d03b3b'));
	const ink = $derived(themeColor('--color-base-content', '#52514e'));
	const surface = $derived(themeColor('--color-base-200', '#fcfcfb'));

	const activityConfig = $derived<ChartConfiguration>({
		type: 'bar',
		data: {
			labels: daily.map((d) => d.day.slice(5)),
			datasets: [
				{
					label: 'Answered',
					data: daily.map((d) => d.count - d.failed),
					backgroundColor: primary,
					borderColor: surface,
					borderWidth: 1,
					borderRadius: 4,
					stack: 'questions'
				},
				{
					label: 'Failed',
					data: daily.map((d) => d.failed),
					backgroundColor: error,
					borderColor: surface,
					borderWidth: 1,
					borderRadius: 4,
					stack: 'questions'
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: { stacked: true, grid: { display: false }, ticks: { color: ink } },
				y: {
					stacked: true,
					grid: { color: `color-mix(in oklab, ${ink} 12%, transparent)` },
					ticks: { color: ink, precision: 0 },
					border: { display: false }
				}
			},
			plugins: { legend: { labels: { color: ink, boxWidth: 12 } } }
		}
	});

	const latencyConfig = $derived<ChartConfiguration>({
		type: 'line',
		data: {
			labels: daily.map((d) => d.day.slice(5)),
			datasets: [
				{
					label: 'Avg latency (ms)',
					data: daily.map((d) => d.avgLatency),
					borderColor: primary,
					backgroundColor: primary,
					borderWidth: 2,
					pointRadius: 4,
					tension: 0.3
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: 'index', intersect: false },
			scales: {
				x: { grid: { display: false }, ticks: { color: ink } },
				y: {
					grid: { color: `color-mix(in oklab, ${ink} 12%, transparent)` },
					ticks: { color: ink },
					border: { display: false }
				}
			},
			plugins: { legend: { display: false } }
		}
	});
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-4">
	<div class="stats stats-vertical sm:stats-horizontal bg-base-200 border-base-300 border">
		<div class="stat">
			<div class="stat-figure text-primary"><Icon icon="lucide:message-square" class="size-7" /></div>
			<div class="stat-title">Total questions</div>
			<div class="stat-value text-3xl">{total}</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-primary"><Icon icon="lucide:users" class="size-7" /></div>
			<div class="stat-title">{data.isAdmin ? 'Users' : 'My records'}</div>
			<div class="stat-value text-3xl">{data.rows.length}</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-primary"><Icon icon="lucide:calendar" class="size-7" /></div>
			<div class="stat-title">Last 14 days</div>
			<div class="stat-value text-3xl">{data.daily.reduce((sum, d) => sum + d.count, 0)}</div>
		</div>

		<div class="stat">
			<div class="stat-figure text-error"><Icon icon="lucide:triangle-alert" class="size-7" /></div>
			<div class="stat-title">Failed</div>
			<div class="stat-value text-3xl">{failed}</div>
		</div>
	</div>

	<div class="bg-base-200 border-base-300 rounded-box border p-4">
		<h2 class="mb-3 text-sm font-semibold">Questions per day</h2>

		{#if daily.length}
			<div class="h-56">
				<Chart config={activityConfig} />
			</div>
		{:else}
			<p class="text-base-content/50 py-8 text-center text-sm">No records yet.</p>
		{/if}
	</div>

	<div class="bg-base-200 border-base-300 rounded-box border p-4">
		<h2 class="mb-3 text-sm font-semibold">Average latency per day</h2>

		{#if daily.length}
			<div class="h-56">
				<Chart config={latencyConfig} />
			</div>
		{:else}
			<p class="text-base-content/50 py-8 text-center text-sm">No records yet.</p>
		{/if}
	</div>

	<div class="bg-base-200 border-base-300 overflow-x-auto rounded-box border">
		<table class="table-sm sm:table-md table">
			<thead>
				<tr>
					<th>User</th>
					<th class="text-right">Questions</th>
					<th class="hidden text-right sm:table-cell">Failed</th>
					<th class="hidden text-right sm:table-cell">Avg latency</th>
					<th class="text-right">Last seen</th>
				</tr>
			</thead>
			<tbody>
				{#each data.rows as row (row.discordUserId)}
					<tr>
						<td>
							<a class="link link-hover" href="/?user={row.discordUserId}">{row.userName}</a>
						</td>
						<td class="text-right font-semibold">{row.count}</td>
						<td class="hidden text-right sm:table-cell">
							{#if row.failed}<span class="text-error">{row.failed}</span>{:else}0{/if}
						</td>
						<td class="hidden text-right sm:table-cell">{row.avgLatency}ms</td>
						<td class="log-mono text-right text-xs opacity-60">{day.format(row.lastSeen)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="text-base-content/50 py-8 text-center">No records yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
