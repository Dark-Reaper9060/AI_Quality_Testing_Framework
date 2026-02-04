import { useEffect, useState } from 'react';
import './Loader.css';

const Loader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = 'auto';
    }, 5000); // 5 seconds

    // Prevent scrolling while loader is active
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader">
        <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="chipGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>

            <linearGradient id="textGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary-foreground))" />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" />
            </linearGradient>

            <linearGradient id="pinGradient" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--muted))" />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" />
            </linearGradient>
          </defs>

          <g id="traces">
            <path d="M100 100 H200 V210 H326" className="trace-bg"></path>
            <path d="M100 100 H200 V210 H326" className="trace-flow purple"></path>

            <path d="M80 180 H180 V230 H326" className="trace-bg"></path>
            <path d="M80 180 H180 V230 H326" className="trace-flow blue"></path>

            <path d="M60 260 H150 V250 H326" className="trace-bg"></path>
            <path d="M60 260 H150 V250 H326" className="trace-flow yellow"></path>

            <path d="M100 350 H200 V270 H326" className="trace-bg"></path>
            <path d="M100 350 H200 V270 H326" className="trace-flow green"></path>

            <path d="M700 90 H560 V210 H474" className="trace-bg"></path>
            <path d="M700 90 H560 V210 H474" className="trace-flow blue"></path>

            <path d="M740 160 H580 V230 H474" className="trace-bg"></path>
            <path d="M740 160 H580 V230 H474" className="trace-flow green"></path>

            <path d="M720 250 H590 V250 H474" className="trace-bg"></path>
            <path d="M720 250 H590 V250 H474" className="trace-flow red"></path>

            <path d="M680 340 H570 V270 H474" className="trace-bg"></path>
            <path d="M680 340 H570 V270 H474" className="trace-flow yellow"></path>
          </g>

          <rect
            x="330"
            y="190"
            width="140"
            height="100"
            rx="20"
            ry="20"
            fill="url(#chipGradient)"
            stroke="hsl(var(--border))"
            strokeWidth="3"
            filter="drop-shadow(0 0 6px rgba(0,0,0,0.8))"
          />

          <g>
            <rect
              x="322"
              y="205"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="322"
              y="225"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="322"
              y="245"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="322"
              y="265"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
          </g>

          <g>
            <rect
              x="470"
              y="205"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="470"
              y="225"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="470"
              y="245"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
            <rect
              x="470"
              y="265"
              width="8"
              height="10"
              fill="url(#pinGradient)"
              rx="2"
            />
          </g>

          <text
            x="400"
            y="240"
            fontFamily="var(--font-sans)"
            fontSize="22"
            fill="url(#textGradient)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Loading
          </text>
        </svg>
      </div>
    </div>
  );
};

export default Loader;
