import { useEffect, useRef } from 'react';

export function useDebounce<T>(
  value: T,
  delay: number,
  callback: (val: T) => void
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      callback(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay, callback]);
}
