import { FormEvent, useState } from 'react';
import { Building2, Headphones, Mail, MapPin, Plane, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { Button, Panel, Section } from '../components/ui';

export function AboutPage() {
  return <Section><div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><h1 className="text-5xl font-black">About CabXpress</h1><p className="mt-5 text-lg leading-8 text-slate-600">CabXpress is a premium local mobility service built for reliable airport transfers, city rides, business travel, family trips, luxury chauffeur bookings, and outstation rides.</p><p className="mt-4 leading-8 text-slate-600">The platform focuses on clean vehicles, transparent pricing, secure online payments, pickup OTP verification, and clear booking communication.</p></div><Panel className="p-6"><h2 className="text-2xl font-black">What riders can expect</h2><div className="mt-5 grid gap-4">{[['Verified vehicles', ShieldCheck], ['Airport-ready rides', Plane], ['Business travel support', Building2], ['Responsive support', Headphones]].map(([label, Icon]: any) => <div key={label} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><Icon className="text-brandDark" /><span className="font-semibold">{label}</span></div>)}</div></Panel></div></Section>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/contact', Object.fromEntries(new FormData(e.currentTarget)));
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Message could not be sent. Please try again.');
    }
  }
  return <Section><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><h1 className="text-5xl font-black">Contact CabXpress</h1><p className="mt-5 leading-8 text-slate-600">Need help with a booking, airport pickup, corporate travel, or vehicle choice? Send a message and the CabXpress team will respond.</p><div className="mt-8 space-y-4"><div className="flex items-center gap-3"><Mail className="text-brandDark" /> support@cabxpress.test</div><div className="flex items-center gap-3"><MapPin className="text-brandDark" /> Colombo, Sri Lanka</div></div></div><form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft"><div className="grid gap-4 md:grid-cols-2"><input name="name" className="rounded-lg border p-3 outline-none focus:border-route" placeholder="Name" required /><input name="email" type="email" className="rounded-lg border p-3 outline-none focus:border-route" placeholder="Email" required /></div><input name="subject" className="mt-4 w-full rounded-lg border p-3 outline-none focus:border-route" placeholder="Subject" required /><textarea name="message" className="mt-4 h-36 w-full rounded-lg border p-3 outline-none focus:border-route" placeholder="Message" required /><Button>Send message</Button>{sent && <p className="mt-3 rounded-lg bg-emerald/10 p-3 text-sm font-semibold text-emerald">Message submitted. We will respond shortly.</p>}{error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}</form></div></Section>;
}
