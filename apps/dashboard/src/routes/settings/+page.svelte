<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	let { data, form } = $props();

	let busy = $state(false);

	const submit = () => {
		busy = true;

		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			busy = false;
		};
	};

	const prompts = $derived([
		{
			key: 'core_prompt',
			title: 'Search prompt',
			hint: 'Always applied: capabilities, language rules, formatting, safety. Personas are appended after this.',
			icon: 'lucide:search',
			value: data.corePrompt
		},
		{
			key: 'default_persona',
			title: 'Default persona',
			hint: 'Used for everyone without an active personal persona.',
			icon: 'lucide:bot',
			value: data.defaultPersona
		}
	]);
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-4">
	{#if form?.message}
		<div class="alert alert-soft alert-info text-sm">{form.message}</div>
	{/if}

	{#each prompts as prompt (prompt.key)}
		<div class="bg-base-200 border-base-300 rounded-box border p-4">
			<h2 class="mb-1 flex items-center gap-2 text-sm font-semibold">
				<Icon icon={prompt.icon} class="size-4" />
				{prompt.title}
			</h2>
			<p class="text-base-content/60 mb-3 text-xs">{prompt.hint}</p>

			<form method="POST" action="?/save" use:enhance={submit} class="flex flex-col gap-2">
				<input type="hidden" name="key" value={prompt.key} />
				<textarea
					name="value"
					rows="8"
					placeholder="Empty: bot reseeds its built-in default on restart"
					class="textarea textarea-sm log-mono w-full text-xs">{prompt.value}</textarea
				>

				<div class="flex justify-end gap-2">
					<button formaction="?/reset" class="btn btn-sm btn-ghost" disabled={busy}>Reset</button>
					<button class="btn btn-sm btn-primary" disabled={busy}>
						{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
						Save
					</button>
				</div>
			</form>
		</div>
	{/each}
</div>
