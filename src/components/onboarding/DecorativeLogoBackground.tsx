/**
 * Decorative background for onboarding and login: large B&W logo
 * partially visible at bottom-left and top-right for texture.
 */

const LOGO_SRC = "/assets/images/logo.png";

/** Large size so only part of the logo is visible in the corners */
const logoSize = "min(75vw, 600px)";

export function DecorativeLogoBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Bottom-left: logo cropped so ~half visible at bottom and left */}
      <div
        className="absolute"
        style={{
          width: logoSize,
          height: logoSize,
          bottom: "-40%",
          left: "-35%",
          opacity: 0.2,
          filter: "grayscale(1)",
        }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Top-right: logo cropped so ~half visible at top and right */}
      <div
        className="absolute"
        style={{
          width: logoSize,
          height: logoSize,
          top: "-40%",
          right: "-35%",
          opacity: 0.2,
          filter: "grayscale(1)",
        }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
