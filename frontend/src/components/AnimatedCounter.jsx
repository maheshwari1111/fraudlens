import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function AnimatedCounter({ value, duration = 1.2, formatter = (v) => Math.round(v).toLocaleString() }) {
  const [displayValue, setDisplayValue] = useState(0);
  const targetVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const objRef = useRef({ val: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(objRef.current, {
        val: targetVal,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          setDisplayValue(objRef.current.val);
        },
      });
    });

    return () => ctx.revert();
  }, [targetVal, duration]);

  return <span className="font-mono tracking-tight">{formatter(displayValue)}</span>;
}
