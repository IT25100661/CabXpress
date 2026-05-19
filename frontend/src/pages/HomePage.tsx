import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, CreditCard, KeyRound, MapPin, Plane, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import CarFrameScroller from '../components/CarFrameScroller';
import { Button, Panel, Reveal, Section, TrustStrip, VehicleCard } from '../components/ui';
import { fallbackVehicles } from '../api/client';

const services = [
  ['Airport Transfers', Plane, 'Flight-ready pickups, luggage-friendly vehicles, and clear arrival coordination.'],
  ['City Rides', MapPin, 'Fast everyday travel for meetings, errands, appointments, and evening plans.'],
  ['Business Travel', BriefcaseBusiness, 'Clean sedans and executive cars for teams, clients, and corporate schedules.'],
  ['Family Trips', UsersRound, 'Comfortable vehicles with extra seats, luggage space, and safe pickup verification.'],
  ['Luxury Chauffeur', Sparkles, 'Premium vehicles for events, hotel transfers, and private travel.'],
  ['Outstation Rides', ArrowRight, 'Reliable longer-distance rides with route-based estimates and booking history.']
];

const faqs = [
  ['How do I book a ride?', 'Choose pickup and destination, select a vehicle, review the fare, then confirm payment. Your booking reference and pickup OTP are shown after confirmation.'],
  ['Can I schedule an airport pickup?', 'Yes. Select your pickup time and choose a luggage-friendly vehicle such as a sedan, SUV, MPV, or van.'],
  ['How is my fare calculated?', 'CabXpress calculates fares from active pricing rules, distance, duration, and selected vehicle category.'],
  ['What payment methods are supported?', 'CabXpress supports secure online card payments when card processing is configured, and every booking shows a clear confirmation state before completion.'],
  ['How does pickup OTP work?', 'Every confirmed ride includes a pickup OTP. Share it with the assigned driver before starting the ride.'],
  ['Can I cancel a booking?', 'You can cancel eligible rides from My Bookings before pickup.']
];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-mist to-transparent" />
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-14 lg:px-8">
          <Reveal className="relative z-10 min-w-0">
            <h1 className="max-w-xl text-5xl font-black leading-tight sm:text-6xl lg:text-6xl xl:text-7xl">Book reliable rides in minutes</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-300">From daily city trips to airport transfers, CabXpress connects you with clean, comfortable vehicles and transparent fares.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/booking"><Button className="w-full sm:w-auto">Book a ride <ArrowRight size={18} /></Button></Link><Link to="/vehicles"><Button variant="outline" className="w-full border-white/20 bg-white/10 text-white sm:w-auto">Browse vehicles</Button></Link></div>
            <Panel className="mt-10 max-w-xl p-3 text-slate-950">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-route" placeholder="Pickup location" />
                <input className="rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-route" placeholder="Destination" />
                <Button onClick={() => navigate('/booking')}>Estimate fare</Button>
              </div>
            </Panel>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['Verified vehicles', 'Transparent pricing', 'Pickup OTP'].map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-100">{item}</div>)}
            </div>
          </Reveal>
          <div className="relative z-0 flex min-h-[360px] min-w-0 items-center justify-center lg:pl-10">
            <motion.div animate={{ x: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }} className="relative w-full max-w-[560px]"><CarFrameScroller /></motion.div>
          </div>
        </div>
      </section>

      <Section>
        <Reveal className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h2 className="text-4xl font-black">Ride services for every plan</h2><p className="mt-3 max-w-2xl text-slate-600">Choose the right vehicle and service style for quick city rides, airport travel, business schedules, or family trips.</p></div><Link to="/booking"><Button variant="dark">Start booking</Button></Link></Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map(([label, Icon, text]: any) => <Reveal key={label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-ink"><Icon /></div><h3 className="text-xl font-black">{label}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></Reveal>)}</div>
      </Section>

      <Section dark>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal><h2 className="text-4xl font-black">Airport transfers that feel planned</h2><p className="mt-4 text-lg leading-8 text-slate-300">Schedule a pickup, choose a luggage-friendly vehicle, and receive clear booking details before you travel.</p><div className="mt-6 flex flex-wrap gap-3">{['Airport pickup', 'Hotel transfer', 'Meet and greet', 'Family luggage'].map((tag) => <span key={tag} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">{tag}</span>)}</div></Reveal>
          <div className="route-grid min-h-80 rounded-lg border border-white/10 bg-white/5 p-6 shadow-soft"><div className="flex h-full flex-col justify-between"><span className="w-max rounded-lg bg-white px-4 py-3 font-bold text-ink">Colombo Fort</span><span className="self-center rounded-lg bg-brand px-5 py-3 font-black text-ink">Airport route · 35 km</span><span className="w-max rounded-lg bg-route px-4 py-3 font-bold text-white">Bandaranaike Airport</span></div></div>
        </div>
      </Section>

      <Section>
        <Reveal><h2 className="text-4xl font-black">Featured vehicles</h2><p className="mt-3 text-slate-600">Verified vehicles for everyday comfort, group travel, and executive rides.</p></Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">{fallbackVehicles.slice(0, 4).map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onBook={() => navigate('/booking')} />)}</div>
      </Section>

      <Section className="bg-white">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal><h2 className="text-4xl font-black">Safety and trust built into every ride</h2><p className="mt-4 text-lg leading-8 text-slate-600">CabXpress shows driver and vehicle details before pickup, confirms bookings by email, and uses pickup OTP verification for safer handoff.</p></Reveal>
          <TrustStrip />
        </div>
      </Section>

      <Section>
        <Reveal><h2 className="text-4xl font-black">A cleaner booking experience</h2></Reveal>
        <div className="mt-8 grid gap-4 md:grid-cols-4">{[['Select route', MapPin], ['Choose vehicle', ShieldCheck], ['Pay securely', CreditCard], ['Show pickup OTP', KeyRound]].map(([label, Icon]: any, i) => <Reveal key={label} className="rounded-lg bg-white p-6 shadow-sm"><span className="text-sm font-black text-slate-400">0{i + 1}</span><Icon className="mt-5 text-brandDark" /><h3 className="mt-4 text-xl font-black">{label}</h3></Reveal>)}</div>
      </Section>

      <Section dark>
        <div className="grid gap-6 md:grid-cols-3">{['Professional drivers', 'Clear fare breakdown', 'Booking history'].map((item) => <Reveal key={item} className="rounded-lg bg-white p-6 text-slate-950"><p className="text-lg font-black">{item}</p><p className="mt-3 leading-7 text-slate-600">Designed for repeat travel with predictable controls, useful ride records, and polished confirmation states.</p></Reveal>)}</div>
      </Section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><Reveal><h2 className="text-4xl font-black">FAQ</h2><p className="mt-3 text-slate-600">Answers for common rider questions.</p></Reveal><div className="space-y-3">{faqs.map(([q, a]) => <details key={q} className="rounded-lg bg-white p-5 shadow-sm"><summary className="cursor-pointer font-bold">{q}</summary><p className="mt-3 leading-7 text-slate-600">{a}</p></details>)}</div></div>
      </Section>

      <footer className="bg-ink py-14 text-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8"><div><h2 className="text-2xl font-black">CabXpress</h2><p className="mt-3 leading-7 text-slate-300">Reliable taxi and cab booking for city rides, airport transfers, and premium travel.</p></div>{[['Company', 'About\nVehicles\nContact'], ['Services', 'Airport transfers\nCity rides\nBusiness travel'], ['Support', 'Help center\nBooking support\nLegal']].map(([h, body]) => <div key={h}><h3 className="font-bold">{h}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{body}</p></div>)}<div><h3 className="font-bold">Newsletter</h3><input className="mt-3 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 outline-none" placeholder="Email address" /></div></div></footer>
    </main>
  );
}
