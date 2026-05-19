import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Button } from './ui';

type Notification = {
  id: number;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
  actionUrl?: string;
};

export function NotificationBell({ endpoint = '/notifications/my', className = '' }: { endpoint?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  async function load() {
    try {
      const [list, unread] = await Promise.all([
        api.get(endpoint),
        api.get('/notifications/my/unread-count')
      ]);
      setItems(Array.isArray(list.data) ? list.data : []);
      setCount(Number(unread.data?.count || 0));
    } catch {
      setItems([]);
      setCount(0);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(load, 20000);
    return () => window.clearInterval(id);
  }, [endpoint]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  async function openNotification(item: Notification) {
    if (!item.readStatus) {
      await api.put(`/notifications/${item.id}/read`).catch(() => null);
      await load();
    }
    setOpen(false);
    if (item.actionUrl) navigate(item.actionUrl);
  }

  async function markAllRead() {
    await api.put('/notifications/read-all').catch(() => null);
    await load();
  }

  return <div ref={ref} className={`relative ${className}`}>
    <button onClick={() => setOpen((value) => !value)} aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-brand">
      <Bell size={19} />
      {count > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-xs font-black text-white">{count > 9 ? '9+' : count}</span>}
    </button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 text-slate-950 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-black">Notifications</h3>
        <button className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-950" onClick={markAllRead}><CheckCheck size={14} /> Mark all</button>
      </div>
      <div className="max-h-80 overflow-auto">
        {items.length ? items.map((item) => <button key={item.id} onClick={() => openNotification(item)} className={`block w-full rounded-lg p-3 text-left hover:bg-slate-50 ${item.readStatus ? '' : 'bg-amber-50'}`}>
          <p className="font-bold">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.message}</p>
        </button>) : <div className="rounded-lg bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">No notifications yet.</div>}
      </div>
      {items.length > 0 && <Button variant="outline" className="mt-3 w-full" onClick={markAllRead}>Mark all as read</Button>}
    </div>}
  </div>;
}
