import { cn } from "@/lib/utils";

export function FeatherSvg({
  uid,
  className,
  tone = "day",
}: {
  uid: string;
  className?: string;
  tone?: "day" | "night";
}) {
  const vane = `${uid}-vane`;
  const shaft = `${uid}-shaft`;
  const gloss = `${uid}-gloss`;
  const soft = `${uid}-soft`;

  const vaneStart = tone === "night" ? "#ead7a8" : "#ffe9b8";
  const vaneMid = tone === "night" ? "#6ed0b4" : "#1f9d7a";
  const vaneEnd = tone === "night" ? "#e0b34a" : "#d9a116";
  const shaftStart = tone === "night" ? "#fff1c8" : "#fff8e4";
  const shaftEnd = tone === "night" ? "#a57a28" : "#b07c18";

  return (
    <svg
      viewBox="0 0 160 400"
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={vane} x1="18" y1="20" x2="142" y2="360" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={vaneStart} />
          <stop offset="42%" stopColor={vaneMid} />
          <stop offset="100%" stopColor={vaneEnd} />
        </linearGradient>
        <linearGradient id={shaft} x1="80" y1="8" x2="80" y2="392" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={shaftStart} />
          <stop offset="100%" stopColor={shaftEnd} />
        </linearGradient>
        <linearGradient id={gloss} x1="90" y1="40" x2="140" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={soft} x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <path
        d="M80 48C42 68 16 118 22 176C28 238 52 292 74 348C76 300 78 196 80 48Z"
        fill={`url(#${vane})`}
        opacity="0.92"
      />
      <path
        d="M80 48C118 68 144 118 138 176C132 238 108 292 86 348C84 300 82 196 80 48Z"
        fill={`url(#${vane})`}
      />
      <path
        d="M80 48C118 68 144 118 138 176C132 210 122 248 108 286C126 214 128 140 104 78C94 60 86 50 80 48Z"
        fill={`url(#${gloss})`}
      />

      {Array.from({ length: 16 }, (_, index) => {
        const y = 58 + index * 17;
        const spread = 18 + index * 2.1;
        return (
          <g key={index} opacity={0.35 - index * 0.012} stroke="white" strokeWidth="0.7">
            <path d={`M80 ${y} C ${80 - spread * 0.4} ${y + 6}, ${80 - spread} ${y + 10}, ${80 - spread * 1.15} ${y + 4}`} />
            <path d={`M80 ${y} C ${80 + spread * 0.4} ${y + 6}, ${80 + spread} ${y + 10}, ${80 + spread * 1.15} ${y + 4}`} />
          </g>
        );
      })}

      <path
        d="M72 338C60 352 54 368 58 384C68 372 76 360 80 348C84 360 92 372 102 384C106 368 100 352 88 338Z"
        fill={vaneStart}
        opacity="0.85"
        filter={`url(#${soft})`}
      />

      <path d="M77 22C79 16 81 16 83 22L86 348L80 392L74 348Z" fill={`url(#${shaft})`} />
      <path d="M79 24L81 24L83 300L80 304L77 300Z" fill="white" opacity="0.35" />
      <path d="M80 388L84 368L80 372L76 368Z" fill="#c49a3c" />
    </svg>
  );
}
