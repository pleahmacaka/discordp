<script lang="ts">
	import Icon from '@iconify/svelte';
	import { authClient } from '$lib/auth-client';

	let busy = $state(false);

	async function signIn() {
		busy = true;
		await authClient.signIn.social({ provider: 'discord', callbackURL: '/' });
	}
</script>

<div class="flex min-h-dvh items-center justify-center p-6">
	<div class="card bg-base-200 w-full max-w-sm shadow-xl">
		<div class="card-body items-center gap-6 text-center">
			<Icon icon="simple-icons:discord" class="text-primary size-12" />

			<div>
				<h1 class="text-2xl font-bold">PBOT Dashboard</h1>
				<p class="text-base-content/60 mt-1 text-sm">Sign in with your Discord account</p>
			</div>

			<button class="btn btn-primary w-full" onclick={signIn} disabled={busy}>
				{#if busy}
					<span class="loading loading-spinner loading-sm"></span>
				{:else}
					<Icon icon="simple-icons:discord" class="size-5" />
				{/if}
				Continue with Discord
			</button>
		</div>
	</div>
</div>
