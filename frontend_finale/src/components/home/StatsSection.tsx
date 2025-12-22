// components/home/StatsSection.tsx
import { useState, useEffect, useRef } from 'react';

interface Stat {
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  icon: string;
  color: string;
}

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const stats: Stat[] = [
    {
      label: 'Documents Traités',
      value: 50000,
      suffix: '+',
      icon: '📄',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Taux de Précision',
      value: 99,
      suffix: '%',
      icon: '🎯',
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Temps de Traitement',
      value: 2,
      suffix: 's',
      prefix: '<',
      icon: '⚡',
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Clients Satisfaits',
      value: 10000,
      suffix: '+',
      icon: '👥',
      color: 'from-orange-500 to-red-500',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-brand-600 via-purple-600 to-pink-600 relative overflow-hidden"
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'slide-bg 20s linear infinite',
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Des Chiffres qui Parlent
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            La confiance de milliers d'utilisateurs à travers le monde
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              stat={stat}
              isVisible={isVisible}
              delay={index * 100}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slide-bg {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(60px, 60px);
          }
        }
      `}</style>
    </section>
  );
}

interface StatCardProps {
  stat: Stat;
  isVisible: boolean;
  delay: number;
}

function StatCard({ stat, isVisible, delay }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = stat.value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, stat.value]);

  return (
    <div
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-3xl"
      style={{
        animation: isVisible ? `slide-in-up 0.6s ease-out ${delay}ms both` : 'none',
      }}
    >
      {/* Icon */}
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} text-white text-3xl mb-6 shadow-lg animate-bounce-in`}>
        {stat.icon}
      </div>

      {/* Number */}
      <div className="mb-2">
        <span className="text-4xl sm:text-5xl font-extrabold text-white">
          {stat.prefix}
          {count.toLocaleString()}
          {stat.suffix}
        </span>
      </div>

      {/* Label */}
      <p className="text-white/90 text-lg font-medium">{stat.label}</p>

      {/* Animated underline */}
      <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
          style={{
            width: isVisible ? '100%' : '0%',
            transitionDelay: `${delay}ms`,
          }}
        ></div>
      </div>
    </div>
  );
}