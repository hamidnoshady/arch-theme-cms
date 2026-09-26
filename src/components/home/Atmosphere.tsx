/**
 * The restrained architectural setting behind the homepage logo: the corner of a
 * white room, a raking shadow, a column and a patch of window light on the floor.
 * Decorative only; physical coordinates are intentional so the composition does
 * not mirror between RTL and LTR.
 */
export function Atmosphere() {
  return (
    <div className="atmos" aria-hidden="true">
      <svg className="atmos__planes atmos__planes--wide" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="atmos-wall" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#E9EBED" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="atmos-floor" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F3F4F5" />
            <stop offset="1" stopColor="#FAFAFA" />
          </linearGradient>
        </defs>
        <polygon className="atmos__plane" points="0,0 27,0 9,76 0,76" fill="url(#atmos-wall)" />
        <polygon className="atmos__plane" points="80,0 100,0 100,90 80,76" fill="#F6F7F8" />
        <polygon className="atmos__plane" points="0,76 80,76 100,90 100,100 0,100" fill="url(#atmos-floor)" />
        <polygon className="atmos__plane atmos__light" points="45,80.5 58,80.5 67,97 49,97" fill="#FFFFFF" />
        <polygon className="atmos__plane" points="18,76 19.4,76 43,100 36,100" fill="#ECEEF0" />
        <line
          className="atmos__edge"
          x1="80"
          y1="76"
          x2="100"
          y2="90"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <svg className="atmos__planes atmos__planes--tall" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="atmos-wall-tall" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#E9EBED" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="atmos__plane" points="0,0 40,0 14,80 0,80" fill="url(#atmos-wall-tall)" />
        <polygon className="atmos__plane" points="88,0 100,0 100,86 88,80" fill="#F6F7F8" />
        <polygon className="atmos__plane" points="0,80 88,80 100,86 100,100 0,100" fill="#F5F6F7" />
        <polygon className="atmos__plane atmos__light" points="38,83 62,83 74,96 44,96" fill="#FFFFFF" />
        <polygon className="atmos__plane" points="7,80 10,80 34,100 24,100" fill="#ECEEF0" />
        <line
          className="atmos__edge"
          x1="88"
          y1="80"
          x2="100"
          y2="86"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="atmos__line atmos__line--floor" />
      <span className="atmos__line atmos__line--corner" />
      <span className="atmos__column" />
    </div>
  )
}
