import { useCallback, useEffect, useState } from 'react';

export function useScrollReveal<T extends HTMLElement>() {
  const [container, setContainer] = useState<T | null>(null);

  const sectionRef = useCallback((node: T | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    const observeReveals = () => {
      container.querySelectorAll<HTMLElement>('.scroll-reveal').forEach((element) => {
        if (!element.classList.contains('visible')) {
          observer.observe(element);
        }
      });
    };

    observeReveals();

    const mutationObserver = new MutationObserver(() => {
      observeReveals();
    });

    mutationObserver.observe(container, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [container]);

  return sectionRef;
}
