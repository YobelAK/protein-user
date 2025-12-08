import { Hero } from '@/components/homepage/hero';
import { SearchBar } from '@/components/homepage/search-bar';
import { PlatformFeatures } from '@/components/homepage/platform-features';
import { PopularDestinations } from '@/components/homepage/popular-destinations';
import { SpecialOffers } from '@/components/homepage/special-offers';
import { Testimonials } from '@/components/homepage/testimonials';
import { Newsletter } from '@/components/homepage/newsletter';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
type Option = { value: string; label: string };

async function getRouteOptions(): Promise<{ from: Option[]; to: Option[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { from: [], to: [] };
  }
  const select = [
    'departureRoute:routes!fastboat_schedules_departureRouteId_fkey(id,name)',
    'arrivalRoute:routes!fastboat_schedules_arrivalRouteId_fkey(id,name)'
  ].join(',');
  const url = `${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(select)}&isActive=eq.true`;
  const res = await fetch(url, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    return { from: [], to: [] };
  }
  const items = await res.json();
  const fromMap = new Map<string, string>();
  const toMap = new Map<string, string>();
  for (const it of Array.isArray(items) ? items : []) {
    const dr = it?.departureRoute;
    const ar = it?.arrivalRoute;
    if (dr?.id && dr?.name) fromMap.set(dr.id, dr.name);
    if (ar?.id && ar?.name) toMap.set(ar.id, ar.name);
  }
  const from: Option[] = Array.from(fromMap.entries()).map(([value, label]) => ({ value, label }));
  const to: Option[] = Array.from(toMap.entries()).map(([value, label]) => ({ value, label }));
  return { from, to };
}

export default async function HomePage() {
  const { from, to } = await getRouteOptions();
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <SearchBar fromOptions={from} toOptions={to} />
      {/* <PlatformFeatures /> */}
      <PopularDestinations />
      {/* <SpecialOffers /> */}
      <Testimonials />
      <Newsletter />
      <Footer />
    </div>
  );
}
