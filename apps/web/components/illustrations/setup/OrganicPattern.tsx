/**
 * The food-waste texture used by steps 2 and 3 (and reusable by FAQs).
 * Render inside <defs> and fill with `url(#id)`; get `id` from `useSvgId()`.
 */
export function OrganicPattern({ id }: { id: string }) {
  return (
    <pattern id={id} width="28" height="18" patternUnits="userSpaceOnUse">
      <rect width="28" height="18" className="fill-bk-illo-organic" />
      <rect x="2" y="3" width="6" height="3" rx="1" className="fill-bk-illo-organic-leaf" />
      <circle cx="14" cy="6" r="2" className="fill-bk-illo-organic-peel" />
      <rect x="19" y="11" width="5" height="3" rx="1" className="fill-bk-illo-organic-green" />
      <circle cx="7" cy="13" r="1.6" className="fill-bk-illo-bran" />
      <rect x="22" y="2" width="3" height="2" className="fill-bk-illo-bran-dark" />
      <circle cx="12" cy="15" r="0.9" className="fill-bk-illo-bran-light" />
      <circle cx="25" cy="8" r="0.9" className="fill-bk-illo-bran-light" />
    </pattern>
  );
}
