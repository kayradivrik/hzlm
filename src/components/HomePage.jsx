export default function HomePage({ settings }) {
  return (
    <section className="space-y-8 pb-8">
      <header className="pt-2">
        <h1 className="font-headline text-5xl font-bold leading-tight text-[#eddcff] sm:text-6xl">
          {settings.homeTitle}
          <br />
          <span className="italic text-rose-600">{settings.homeHighlight}</span>
        </h1>
        <div className="mt-3 h-[2px] w-16 bg-rose-100" />
      </header>

      <blockquote className="border-l border-[#4a454d] pl-4 text-2xl italic leading-relaxed text-[#cbc4ce]">
        "{settings.homeQuote}"
      </blockquote>

      <div className="glass-card rounded-3xl border border-[#4a454d]/20 p-6">
        <h2 className="font-headline text-3xl text-[#eddcff]">{settings.purposeTitle}</h2>
        <p className="mt-3 whitespace-pre-wrap text-lg leading-relaxed text-[#cbc4ce]">{settings.purposeText}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-card rounded-2xl border border-[#4a454d]/20 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-600">{settings.homeCard1Tag}</p>
          <h3 className="mt-2 font-headline text-2xl text-[#eddcff]">{settings.homeCard1Title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cbc4ce]">{settings.homeCard1Text}</p>
        </article>

        <article className="glass-card rounded-2xl border border-[#4a454d]/20 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-600">{settings.homeCard2Tag}</p>
          <h3 className="mt-2 font-headline text-2xl text-[#eddcff]">{settings.homeCard2Title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cbc4ce]">{settings.homeCard2Text}</p>
        </article>

        <article className="glass-card rounded-2xl border border-[#4a454d]/20 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-600">{settings.homeCard3Tag}</p>
          <h3 className="mt-2 font-headline text-2xl text-[#eddcff]">{settings.homeCard3Title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cbc4ce]">{settings.homeCard3Text}</p>
        </article>
      </div>

      <div className="glass-card rounded-3xl border border-[#4a454d]/20 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-600">{settings.homeNoteLabel}</p>
        <p className="mt-3 whitespace-pre-wrap text-xl italic leading-relaxed text-[#eddcff]">"{settings.homeNoteQuote}"</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{settings.homeNoteText}</p>
      </div>
    </section>
  )
}
