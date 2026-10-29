/** The clean, simple checkmark (same stroke as the diner's "Added" button). */
export default function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 ${className}`}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
