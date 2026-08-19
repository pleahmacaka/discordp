<script lang="ts">
	import Icon from '@iconify/svelte';

	let { data } = $props();

	const time = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Seoul',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-4">
	<form class="flex flex-wrap gap-2" data-sveltekit-keepfocus>
		<label class="input input-sm flex-1 basis-60">
			<Icon icon="lucide:search" class="size-4 opacity-60" />
			<input name="q" value={data.query} placeholder="Search questions, answers, names" />
		</label>

		{#if data.isAdmin}
			<select name="user" class="select select-sm w-44">
				<option value="">All users</option>
				{#each data.people as person (person.discordUserId)}
					<option value={person.discordUserId} selected={person.discordUserId === data.onlyUser}>
						{person.userName}
					</option>
				{/each}
			</select>
		{/if}

		<button class="btn btn-sm btn-primary">Search</button>
	</form>

	<div class="bg-base-200 border-base-300 overflow-hidden rounded-box border">
		{#each data.rows as row (row.id)}
			<details class="border-base-300 group border-b last:border-b-0">
				<summary
					class="log-mono hover:bg-base-300 flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-xs"
				>
					<span
						class="size-2 shrink-0 rounded-full {row.ok ? 'bg-success' : 'bg-error'}"
						title={row.ok ? 'ok' : 'error'}
					></span>

					<span class="opacity-60">{time.format(row.createdAt)}</span>

					<span class="hidden w-28 shrink-0 truncate sm:block">{row.userName}</span>

					<span class="badge badge-ghost badge-xs hidden shrink-0 md:inline-flex">{row.source}</span>

					<span class="flex-1 truncate">{row.question}</span>

					<span class="shrink-0 opacity-60">{row.latencyMs}ms</span>

					<Icon
						icon="lucide:chevron-right"
						class="size-4 shrink-0 opacity-40 transition-transform group-open:rotate-90"
					/>
				</summary>

				<div class="bg-base-100 space-y-3 px-4 py-3 text-sm">
					<div class="text-base-content/50 log-mono flex flex-wrap gap-x-4 gap-y-1 text-xs">
						<span>{row.userName} ({row.discordUserId})</span>
						{#if row.guildId}<span>guild {row.guildId}</span>{/if}
						{#if row.channelId}<span>channel {row.channelId}</span>{/if}
						{#if row.persona}<span>persona {row.persona}</span>{/if}
					</div>

					<div>
						<div class="text-base-content/50 mb-1 text-xs font-semibold">Question</div>
						<p class="whitespace-pre-wrap">{row.question}</p>
					</div>

					{#if row.answer}
						<div>
							<div class="text-base-content/50 mb-1 text-xs font-semibold">Answer</div>
							<p class="whitespace-pre-wrap">{row.answer}</p>
						</div>
					{/if}

					{#if row.systemPrompt}
						<details>
							<summary class="text-base-content/50 cursor-pointer text-xs font-semibold">
								System prompt
							</summary>
							<p class="text-base-content/70 mt-1 text-xs whitespace-pre-wrap">{row.systemPrompt}</p>
						</details>
					{/if}

					{#if row.error}
						<div class="alert alert-error alert-soft text-xs">{row.error}</div>
					{/if}
				</div>
			</details>
		{:else}
			<p class="text-base-content/50 p-8 text-center text-sm">No records yet.</p>
		{/each}
	</div>

	{#if data.rows.length === data.pageSize}
		<p class="text-base-content/40 text-center text-xs">Showing the latest {data.pageSize} records.</p>
	{/if}
</div>
