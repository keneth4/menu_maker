<svelte:head>
  <title>Menú Interactivo</title>
</svelte:head>

<main class="min-h-screen px-5 py-8">
  <section class="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
    <div
      class="absolute inset-0 bg-cover bg-center opacity-60"
      style="background-image: url('/assets/backgrounds/background.webp');"
    ></div>
    <div class="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950"></div>

    <div class="relative z-10">
      <header class="flex items-start justify-between gap-4">
        <div>
          <p class="text-[0.6rem] uppercase tracking-[0.5em] text-amber-300/90">Bar / Pub</p>
          <h1 class="mt-3 text-2xl font-semibold text-slate-100">Menú elegante</h1>
          <p class="mt-2 text-sm text-slate-300">
            MVP base con fondo animado y platillo 360°.
          </p>
        </div>
        <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] text-slate-200">
          ES / EN
        </div>
      </header>

      <section class="mt-8 grid gap-5">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.35em] text-slate-300">Cócteles</p>
          <div class="mt-4 grid gap-4">
            <div class="flex items-center gap-4">
              <div class="dish-frame">
                <img src="/assets/dishes/sample360food.gif" alt="Platillo 360" class="dish-media" />
                <div class="dish-glow"></div>
              </div>
              <div>
                <p class="text-sm text-slate-100">Negroni Ahumado</p>
                <p class="mt-1 text-xs text-slate-400">Gin, vermut rojo, bitter.</p>
              </div>
              <p class="ml-auto text-sm text-amber-200">$180</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs uppercase tracking-[0.35em] text-slate-300">Especial</p>
          <div class="mt-4 flex items-center gap-4">
            <div class="dish-frame">
              <img src="/assets/dishes/sample360food.gif" alt="Platillo 360" class="dish-media" />
              <div class="dish-glow"></div>
            </div>
            <div>
              <p class="text-sm text-slate-100">Tapas de la casa</p>
              <p class="mt-1 text-xs text-slate-400">Aceituna, jamón ibérico, pan.</p>
            </div>
            <p class="ml-auto text-sm text-amber-200">$140</p>
          </div>
        </div>
      </section>
    </div>
  </section>
</main>
