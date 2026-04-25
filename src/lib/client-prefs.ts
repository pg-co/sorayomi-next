import { useEffect, useState } from 'react';

const NSFW_KEY = 'sorayomi:show-nsfw';
const NSFW_EVENT = 'sorayomi:show-nsfw-changed';

export function readShowNsfw(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(NSFW_KEY) === '1';
}

export function writeShowNsfw(next: boolean) {
  if (next) window.localStorage.setItem(NSFW_KEY, '1');
  else window.localStorage.removeItem(NSFW_KEY);
  window.dispatchEvent(new CustomEvent(NSFW_EVENT));
}

export function useShowNsfw(): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => readShowNsfw());
  useEffect(() => {
    const onChange = () => setValue(readShowNsfw());
    window.addEventListener(NSFW_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(NSFW_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  function update(next: boolean) {
    writeShowNsfw(next);
    setValue(next);
  }
  return [value, update];
}
