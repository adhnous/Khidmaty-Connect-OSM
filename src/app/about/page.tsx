export const dynamic = 'force-static';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <section className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">About Khidmaty Connect</h1>
        <p className="text-muted-foreground">
          Khidmaty Connect is a local services marketplace for Libya. We help people find and hire
          trusted providers for everyday needs, and we help providers grow their businesses online.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="mb-2 text-xl font-semibold">For Seekers</h2>
            <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li>Search by city, area, and category</li>
              <li>Explore provider profiles and pricing</li>
              <li>Contact via phone or WhatsApp</li>
            </ul>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="mb-2 text-xl font-semibold">For Providers</h2>
            <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              <li>Create a profile and publish your services</li>
              <li>Showcase photos and service packages</li>
              <li>Reach customers across Libya</li>
            </ul>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-xl font-semibold">Technology</h2>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, TypeScript, Tailwind CSS, Firebase, and free mapping tools.
            We prioritize performance, privacy, and accessibility.
          </p>
        </div>
      </section>
    </main>
  );
}
