const React = require("react");
const { useEffect, useRef } = React;

/**
 * RainyGlass - Physics-driven rain on glass canvas component
 *
 * @param {Object} props
 * @param {string} [props.className] - CSS class for canvas wrapper
 * @param {Object} [props.style] - Inline style for canvas wrapper
 * @param {number} [props.density=1] - Droplet density multiplier (0.5 to 2.0)
 * @param {number} [props.speed=1] - Sliding speed multiplier (0.5 to 2.0)
 * @param {string} [props.backdropImage] - Optional background image URL
 */
function RainyGlass({
  className = "",
  style = {},
  density = 1,
  speed = 1,
  backdropImage = ""
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const parent = canvas.parentElement;
    let width = (canvas.width = parent ? parent.offsetWidth : window.innerWidth);
    let height = (canvas.height = parent ? parent.offsetHeight : window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const p = canvas.parentElement;
      width = canvas.width = p ? p.offsetWidth : window.innerWidth;
      height = canvas.height = p ? p.offsetHeight : window.innerHeight;
      initStaticDrops();
    };

    window.addEventListener("resize", handleResize);

    // 1. Static micro-droplets resting on the glass
    let staticDrops = [];
    const initStaticDrops = () => {
      staticDrops = [];
      const baseArea = 3800 / Math.max(0.2, density);
      const count = Math.floor((width * height) / baseArea);
      for (let i = 0; i < count; i++) {
        staticDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.2 + 0.6,
          alpha: Math.random() * 0.45 + 0.35
        });
      }
    };
    initStaticDrops();

    // 2. Active gravity-driven sliding droplets
    const activeDrops = [];
    const maxActiveDrops = Math.max(12, Math.floor((width / 75) * density));

    class SlidingDrop {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -20 - Math.random() * 80;
        this.r = Math.random() * 3.5 + 2.5;
        this.speed = (Math.random() * 1.8 + 0.8) * speed;
        this.trail = [];
        this.trailTimer = 0;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.wobble += this.wobbleSpeed;

        // Surface tension physics: stutter and slide bursts
        if (Math.random() < 0.03) {
          this.speed = Math.max(0.2, this.speed * 0.4);
        } else if (Math.random() < 0.06) {
          this.speed = Math.min(6.5 * speed, this.speed + 1.2);
        }

        this.y += this.speed;
        this.x += Math.sin(this.wobble) * 0.35;

        // Leave tiny trail droplets behind
        this.trailTimer++;
        if (this.trailTimer % 7 === 0 && Math.random() < 0.8) {
          this.trail.push({
            x: this.x + (Math.random() - 0.5) * 1.5,
            y: this.y - this.r,
            r: Math.random() * 1.2 + 0.5,
            alpha: 0.6
          });
        }

        // Fade out trails
        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].alpha -= 0.003;
          if (this.trail[i].alpha <= 0) {
            this.trail.splice(i, 1);
          }
        }

        if (this.y > height + 50) {
          this.reset(false);
        }
      }

      draw(c) {
        // Draw droplet trail
        for (let i = 0; i < this.trail.length; i++) {
          const t = this.trail[i];
          if (t.alpha <= 0.05) continue;
          c.save();
          c.globalAlpha = t.alpha;

          // Dark meniscus
          c.beginPath();
          c.arc(t.x, t.y, t.r + 0.3, 0, Math.PI * 2);
          c.fillStyle = "rgba(0, 0, 0, 0.5)";
          c.fill();

          // Refraction body
          c.beginPath();
          c.arc(t.x, t.y, t.r, 0, Math.PI * 2);
          c.fillStyle = "rgba(220, 245, 235, 0.4)";
          c.fill();

          // Specular glint
          c.beginPath();
          c.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, Math.max(0.4, t.r * 0.3), 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.95)";
          c.fill();
          c.restore();
        }

        // Draw main sliding droplet with true optical water refraction
        c.save();

        const stretch = Math.min(1.5, 1 + this.speed * 0.08);
        const rx = this.r;
        const ry = this.r * stretch;

        // Dark meniscus edge
        c.beginPath();
        c.ellipse(this.x, this.y, rx + 0.6, ry + 0.6, 0, 0, Math.PI * 2);
        c.fillStyle = "rgba(0, 0, 0, 0.65)";
        c.fill();

        // Lens refraction: dark upper half, luminous lower caustic
        const dropGrad = c.createLinearGradient(
          this.x,
          this.y - ry,
          this.x,
          this.y + ry
        );
        dropGrad.addColorStop(0, "rgba(10, 25, 18, 0.75)");
        dropGrad.addColorStop(0.4, "rgba(30, 60, 45, 0.3)");
        dropGrad.addColorStop(0.75, "rgba(180, 230, 210, 0.45)");
        dropGrad.addColorStop(1, "rgba(240, 255, 245, 0.7)");
        c.beginPath();
        c.ellipse(this.x, this.y, rx, ry, 0, 0, Math.PI * 2);
        c.fillStyle = dropGrad;
        c.fill();

        // Primary sharp specular reflection
        c.beginPath();
        c.ellipse(
          this.x - rx * 0.35,
          this.y - ry * 0.38,
          rx * 0.38,
          ry * 0.22,
          -0.25,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(255, 255, 255, 0.95)";
        c.fill();

        // Secondary pinpoint highlight
        c.beginPath();
        c.arc(
          this.x - rx * 0.15,
          this.y - ry * 0.52,
          Math.max(0.6, rx * 0.15),
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(255, 255, 255, 0.85)";
        c.fill();

        // Bottom caustic rim
        c.beginPath();
        c.ellipse(
          this.x + rx * 0.1,
          this.y + ry * 0.65,
          rx * 0.5,
          ry * 0.18,
          0.1,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(220, 255, 235, 0.5)";
        c.fill();

        c.restore();
      }
    }

    for (let i = 0; i < maxActiveDrops; i++) {
      activeDrops.push(new SlidingDrop());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render static drops
      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.4})`;
        ctx.fill();

        // Tiny specular dot
        if (d.r > 1.2) {
          ctx.beginPath();
          ctx.arc(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha * 0.9})`;
          ctx.fill();
        }
      }

      // Update & render sliding drops
      for (let i = 0; i < activeDrops.length; i++) {
        activeDrops[i].update();
        activeDrops[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, speed]);

  return React.createElement("div", {
    className: className,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      overflow: "hidden",
      backgroundImage: backdropImage ? `url(${backdropImage})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      ...style
    }
  }, React.createElement("canvas", {
    ref: canvasRef,
    style: { display: "block", width: "100%", height: "100%" }
  }));
}

module.exports = RainyGlass;
module.exports.default = RainyGlass;

