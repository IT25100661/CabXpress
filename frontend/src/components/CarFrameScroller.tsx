import { useEffect, useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const frameModules = import.meta.glob('../assets/frames/frame_*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export default function CarFrameScroller() {
  const frames = useMemo(() => Object.values(frameModules).sort(), []);
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 0.28], ['-18%', '18%']);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (value) => {
      if (!frames.length) return;
      setIndex(Math.min(frames.length - 1, Math.max(0, Math.floor(value * 240))));
    });
  }, [frames.length, scrollYProgress]);

  if (!frames.length) {
    return <motion.div style={{ x }} className="luxury-car" aria-label="Luxury cab animation fallback" />;
  }

  return <motion.img style={{ x }} src={frames[index]} alt="CabXpress car scroll animation frame" className="w-[min(720px,88vw)] object-contain drop-shadow-2xl" loading="eager" />;
}
