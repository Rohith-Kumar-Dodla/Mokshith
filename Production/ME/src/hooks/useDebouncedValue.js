import { useEffect, useState } from 'react';

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timerId);
  }, [value, delay]);

  return debounced;
}

export default useDebouncedValue;
