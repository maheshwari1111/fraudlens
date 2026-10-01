import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Radar, ShieldAlert, Crosshair } from 'lucide-react';

const DETECTED_TARGETS = [
  { id: 'T-904', angle: 45, radius: 65, type: 'Velocity Anomaly', level: 'HIGH', label: 'TX_9042 ($4,500)' },
  { id: 'T-108', angle: 120, radius: 40, type: 'Device Mismatch', level: 'CRITICAL', label: 'DEV_MAC_88' },
  { id: 'T-302', angle: 210, radius: 75, type: 'Geo Hop', level: 'MEDIUM', label: 'IP_GEO_SING' },
  { id: 'T-511', angle: 310, radius: 50, type: 'New Device', level: 'LOW', label: 'IPHONE_15_PRO' },
];

export default function RadarScannerGSAP() {
  const sweepRef = useRef(null);
  const containerRef = useRef(null);
  const [activeTarget, setActiveTarget] = useState(DETECTED_TARGETS[0]);

  useEffect(() => {
    if (!sweepRef.current) return;
    
    // Smooth infinite GSAP rotation for the radar sweep beam
    const tween = gsap.to(sweepRef.current, {
      rotation: 360,
      duration: 4,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%',
    });

    // Target pulse animation
    if (containerRef.current) {
      const pings = containerRef.current.querySelectorAll('.radar-ping');
      gsap.to(pings, {
        scale: 1.4,
        opacity: 0.2,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        stagger: 0.3,
        ease: 'sine.inOut',
      });
    }

    return () => tween.kill();
  }, []);

  return (
    <div className="card relative overflow-hidden flex flex-col justify-between" ref={containerRef}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="card-header mb-0 flex items-center gap-2">
          <Radar className="w-4 h-4 text-cyber-neon animate-spin-slow" />
          Real-Time Threat Radar
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          SCANNING 240Hz
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6 my-2">
        {/* Radar Graphic Container */}
        <div className="relative w-48 h-48 rounded-full border border-accent-500/30 bg-surface-950/80 p-2 flex items-center justify-center shrink-0 shadow-neon-accent/10">
          {/* Concentric Grid Circles */}
          <div className="absolute inset-4 rounded-full border border-surface-700/40" />
          <div className="absolute inset-10 rounded-full border border-surface-700/40 border-dashed" />
          <div className="absolute inset-16 rounded-full border border-accent-500/20" />

          {/* Crosshair Lines */}
          <div className="absolute w-full h-[1px] bg-surface-700/30" />
          <div className="absolute h-full w-[1px] bg-surface-700/30" />

          {/* Rotating Sweep Line */}
          <div
            ref={sweepRef}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(56, 189, 248, 0.4) 360deg)',
            }}
          >
            <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-gradient-to-t from-accent-400 to-cyber-neon shadow-neon-accent" />
          </div>

          {/* Radar Target Markers */}
          {DETECTED_TARGETS.map((t) => {
            const rad = (t.angle * Math.PI) / 180;
            const x = Math.cos(rad) * (t.radius * 0.9);
            const y = Math.sin(rad) * (t.radius * 0.9);
            const colorClass =
              t.level === 'CRITICAL' ? 'bg-red-500 shadow-neon-red' :
              t.level === 'HIGH' ? 'bg-orange-500' : 'bg-emerald-400';

            return (
              <button
                key={t.id}
                onClick={() => setActiveTarget(t)}
                style={{ transform: `translate(${x}px, ${y}px)` }}
                className={`absolute w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-150 ${colorClass}`}
              >
                <span className={`radar-ping absolute -inset-1 rounded-full ${colorClass} opacity-60`} />
              </button>
            );
          })}
        </div>

        {/* Target Details Telemetry */}
        <div className="flex-1 w-full bg-surface-950/60 rounded-xl p-4 border border-surface-800/80">
          <div className="flex items-center gap-2 text-xs font-mono text-surface-400 mb-2">
            <Crosshair className="w-3.5 h-3.5 text-accent-400" />
            TARGET TELEMETRY LOCK
          </div>
          {activeTarget && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white font-mono">{activeTarget.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  activeTarget.level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  activeTarget.level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {activeTarget.level}
                </span>
              </div>
              <p className="text-xs text-surface-300">Signal Anomaly: <span className="text-accent-300 font-semibold">{activeTarget.type}</span></p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-surface-400 pt-1 border-t border-surface-800">
                <div>BEARING: {activeTarget.angle}°</div>
                <div>RANGE: {activeTarget.radius} km</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
