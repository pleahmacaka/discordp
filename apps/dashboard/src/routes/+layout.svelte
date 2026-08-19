<script lang="ts">
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import Icon from '@iconify/svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children, data } = $props();

	let collapsed = $state(false);

	const nav = $derived([
		{ href: '/', label: 'Logs', icon: 'lucide:scroll-text' },
		{ href: '/stats', label: 'Stats', icon: 'lucide:bar-chart-3' },
		{ href: '/personas', label: 'Personas', icon: 'lucide:drama' },
		...(data.isAdmin ? [{ href: '/settings', label: 'Settings', icon: 'lucide:settings' }] : [])
	]);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !data.user}
	{@render children()}
{:else}
	<div class="drawer lg:drawer-open">
		<input id="sidebar" type="checkbox" class="drawer-toggle" />

		<div class="drawer-content flex min-h-dvh flex-col">
			<header class="navbar bg-base-200 border-base-300 sticky top-0 z-30 border-b px-3">
				<label for="sidebar" class="btn btn-ghost btn-square lg:hidden">
					<Icon icon="lucide:menu" class="size-5" />
				</label>

				<span class="ml-1 flex-1 font-semibold">
					{nav.find((item) => item.href === page.url.pathname)?.label ?? 'PBOT'}
				</span>

				<div class="flex items-center gap-2">
					{#if data.isAdmin}
						<span class="badge badge-primary badge-sm gap-1">
							<Icon icon="lucide:shield" class="size-3" /> developer
						</span>
					{/if}
					<div class="avatar">
						<div class="w-8 rounded-full">
							<img src={data.user.image ?? favicon} alt={data.user.name} />
						</div>
					</div>
				</div>
			</header>

			<main class="flex-1 p-3 sm:p-5">
				{@render children()}
			</main>
		</div>

		<div class="drawer-side z-40">
			<label for="sidebar" class="drawer-overlay" aria-label="Close"></label>

			<aside
				class="bg-base-200 border-base-300 flex min-h-dvh flex-col border-r transition-[width] duration-200"
				class:w-60={!collapsed}
				class:w-16={collapsed}
			>
				<div class="flex h-16 items-center gap-2 px-4">
					<Icon icon="lucide:bird" class="text-primary size-6 shrink-0" />
					{#if !collapsed}<span class="truncate font-bold">PBOT</span>{/if}
				</div>

				<ul class="menu w-full grow gap-1 px-2">
					{#each nav as item (item.href)}
						<li>
							<a
								href={item.href}
								class:menu-active={page.url.pathname === item.href}
								class:justify-center={collapsed}
								title={item.label}
							>
								<Icon icon={item.icon} class="size-5 shrink-0" />
								{#if !collapsed}<span>{item.label}</span>{/if}
							</a>
						</li>
					{/each}
				</ul>

				<ul class="menu w-full gap-1 px-2 pb-3">
					<li class="hidden lg:block">
						<button onclick={() => (collapsed = !collapsed)} class:justify-center={collapsed}>
							<Icon
								icon={collapsed ? 'lucide:chevrons-right' : 'lucide:chevrons-left'}
								class="size-5 shrink-0"
							/>
							{#if !collapsed}<span>Collapse</span>{/if}
						</button>
					</li>
					<li>
						<button
							onclick={() => authClient.signOut().then(() => location.reload())}
							class:justify-center={collapsed}
						>
							<Icon icon="lucide:log-out" class="size-5 shrink-0" />
							{#if !collapsed}<span>Sign out</span>{/if}
						</button>
					</li>
				</ul>
			</aside>
		</div>
	</div>
{/if}
