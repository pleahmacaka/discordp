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
</script>

<div class="mx-auto flex max-w-3xl flex-col gap-4">
	{#if data.users.length}
		<form class="flex items-center gap-2" data-sveltekit-keepfocus>
			<Icon icon="lucide:user-cog" class="size-4 opacity-60" />
			<select name="user" class="select select-sm w-56" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#each data.users as user (user.id)}
					<option value={user.id} selected={user.id === data.target}>{user.name}</option>
				{/each}
			</select>
			<span class="text-base-content/50 text-xs">Editing as developer</span>
		</form>
	{/if}

	{#if form?.message}
		<div class="alert alert-soft alert-info text-sm">{form.message}</div>
	{/if}

	<div class="bg-base-200 border-base-300 rounded-box border p-4">
		<h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
			<Icon icon="lucide:plus" class="size-4" /> New persona ({data.personas.length}/{data.maxPersonas})
		</h2>

		<form method="POST" action="?/save" use:enhance={submit} class="flex flex-col gap-2">
			<input type="hidden" name="user" value={data.target} />
			<input name="name" maxlength="32" required placeholder="Name" class="input input-sm w-full" />
			<textarea
				name="content"
				maxlength="2000"
				required
				rows="5"
				placeholder="Persona description (SFW only, reviewed before saving)"
				class="textarea textarea-sm w-full"
			></textarea>
			<button class="btn btn-sm btn-primary self-end" disabled={busy}>
				{#if busy}<span class="loading loading-spinner loading-xs"></span>{/if}
				Save
			</button>
		</form>
	</div>

	{#each data.personas as persona (persona.name)}
		<div class="bg-base-200 border-base-300 rounded-box border p-4">
			<div class="mb-2 flex items-center gap-2">
				<span class="font-semibold">{persona.name}</span>
				{#if persona.active}<span class="badge badge-primary badge-sm">active</span>{/if}

				<div class="ml-auto flex gap-1">
					{#if !persona.active}
						<form method="POST" action="?/activate" use:enhance={submit}>
							<input type="hidden" name="user" value={data.target} />
							<input type="hidden" name="name" value={persona.name} />
							<button class="btn btn-xs" disabled={busy}>Activate</button>
						</form>
					{/if}
					<form method="POST" action="?/delete" use:enhance={submit}>
						<input type="hidden" name="user" value={data.target} />
						<input type="hidden" name="name" value={persona.name} />
						<button class="btn btn-xs btn-error btn-outline" disabled={busy}>Delete</button>
					</form>
				</div>
			</div>

			<form method="POST" action="?/save" use:enhance={submit} class="flex flex-col gap-2">
				<input type="hidden" name="user" value={data.target} />
				<input type="hidden" name="name" value={persona.name} />
				<textarea name="content" maxlength="2000" rows="4" class="textarea textarea-sm w-full"
					>{persona.content}</textarea
				>
				<button class="btn btn-xs self-end" disabled={busy}>Update</button>
			</form>
		</div>
	{:else}
		<p class="text-base-content/50 py-4 text-center text-sm">
			No personas yet. PBOT uses the default persona.
		</p>
	{/each}

	{#if data.personas.some((p) => p.active)}
		<form method="POST" action="?/reset" use:enhance={submit} class="self-end">
			<input type="hidden" name="user" value={data.target} />
			<button class="btn btn-sm btn-ghost" disabled={busy}>Use default persona</button>
		</form>
	{/if}
</div>
