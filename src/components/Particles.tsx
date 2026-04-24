'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ParticlesProps {
  count?: number;
  className?: string;
}

export default function Particles({ count = 15, className = '' }: ParticlesProps) {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Array<{x: number, y: number}>>([]);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: count }, () => ({
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
      }))
    );
  }, [count]);

  if (!mounted) return null;

  return (
    <div className={className}>
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-[#0071e3]/10 rounded-full"
          initial={{ x: particle.x, y: particle.y }}
          animate={{
            x: [particle.x, Math.random() * window.innerWidth],
            y: [particle.y, Math.random() * window.innerHeight],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}
    </div>
  );
}
