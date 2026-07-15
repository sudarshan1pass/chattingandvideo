type CallIconProps = {
  name:
    | "add"
    | "audio"
    | "camera"
    | "compose"
    | "heart"
    | "info"
    | "mic"
    | "photo"
    | "search"
    | "send"
    | "smile"
    | "video";
};

export function CallIcon({ name }: CallIconProps) {
  const paths = {
    add: <path d="M12 5v14M5 12h14" />,
    audio: (
      <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L7.1 8.64a16 16 0 0 0 6.26 6.26l1.18-1.18a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    ),
    camera: (
      <>
        <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <circle cx="12" cy="12.5" r="3.25" />
      </>
    ),
    compose: (
      <>
        <path d="M12 20H5a1 1 0 0 1-1-1v-7" />
        <path d="m16.5 3.5 4 4L10 18l-4.5 1 1-4.5Z" />
      </>
    ),
    heart: <path d="M20.8 4.6a5 5 0 0 0-7.07 0L12 6.33l-1.73-1.72A5 5 0 0 0 3.2 11.68L12 20.5l8.8-8.82a5 5 0 0 0 0-7.08Z" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
    mic: (
      <>
        <rect height="11" rx="4" width="7" x="8.5" y="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    ),
    photo: (
      <>
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m21 15-4.5-4.5L7 20" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.4-4.4" />
      </>
    ),
    send: <path d="m21 3-8.5 18-2.1-7.4L3 11.5 21 3ZM10.4 13.6l4-4" />,
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14.5a5 5 0 0 0 8 0M9 9h.01M15 9h.01" />
      </>
    ),
    video: (
      <>
        <rect height="12" rx="2" width="13" x="3" y="6" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}
