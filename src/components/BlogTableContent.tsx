'use client';

import { useEffect, useState } from 'react';

// Define the type for a heading
export type Heading = {
  id: string;
  text: string;
  level: number;
};

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  return (
    <div className="sticky top-24 p-6 rounded-lg border bg-slate-50">
      <h4 className="font-semibold mb-4">Table of Contents</h4>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id} style={{ marginLeft: `${(heading.level - 2) * 1}rem` }}>
              <a
                href={`#${heading.id}`}
                className={`text-sm ${activeId === heading.id ? 'text-primary font-bold' : 'text-gray-600 hover:text-black'}`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}