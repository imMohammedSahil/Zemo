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
    let width = parent ? parent.offsetWidth : window.innerWidth;
    let height = parent ? parent.offsetHeight : window.innerHeight;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      const p = canvas.parentElement;
      width = p ? p.offsetWidth : window.innerWidth;
      height = p ? p.offsetHeight : window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.scale(dpr, dpr);
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
        const baseR = Math.random() * 2.2 + 0.6;
        staticDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          rx: baseR * (Math.random() * 0.35 + 0.85),
          ry: baseR * (Math.random() * 0.4 + 0.9),
          angle: (Math.random() - 0.5) * 0.6,
          alpha: Math.random() * 0.45 + 0.35
        });
      }
    };
    initStaticDrops();

    const traceWaterBead = (c, x, y, rx, ry, tilt = 0) => {
      c.save();
      c.translate(x, y);
      c.rotate(tilt);

      c.beginPath();
      c.moveTo(0, -ry);
      c.bezierCurveTo(rx * 0.9, -ry * 0.9, rx * 1.05, ry * 0.3, rx * 0.85, ry * 0.85);
      c.bezierCurveTo(rx * 0.5, ry * 1.05, -rx * 0.5, ry * 1.05, -rx * 0.85, ry * 0.85);
      c.bezierCurveTo(-rx * 1.05, ry * 0.3, -rx * 0.9, -ry * 0.9, 0, -ry);
      c.closePath();
      c.restore();
    };

    // 2. Active gravity-driven sliding droplets
    const activeDrops = [];
    const maxActiveDrops = Math.max(6, Math.floor((width / 180) * density));

    class SlidingDrop {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * (height * 0.85) : -25 - Math.random() * 50;
        this.r = (Math.random() * 1.8 + 2.6) * Math.max(0.5, density);
        this.tilt = (Math.random() - 0.5) * 0.15;
        this.aspectY = Math.random() * 0.3 + 1.25;

        this.state = 'RESTING';
        this.restTimer = Math.floor(Math.random() * 200 + (initial ? 30 : 120));
        this.slideRemaining = 0;
        this.velocity = 0;
        this.maxSlowSpeed = (Math.random() * 0.5 + 0.7) * speed;
        this.trail = [];
      }

      update() {
        if (this.state === 'RESTING') {
          this.restTimer--;
          if (this.restTimer <= 0) {
            this.state = 'SLIDING';
            this.slideRemaining = Math.floor(Math.random() * 70 + 30);
            this.velocity = Math.random() * 0.3 + 0.3;
          }
        } else if (this.state === 'SLIDING') {
          this.velocity = Math.min(this.maxSlowSpeed, this.velocity + 0.04);
          this.y += this.velocity;
          this.slideRemaining -= this.velocity;

          if (Math.random() < 0.1) {
            this.x += (Math.random() - 0.5) * 0.25;
          }

          if (Math.random() < 0.18) {
            this.trail.push({
              x: this.x + (Math.random() - 0.5) * (this.r * 0.3),
              y: this.y - this.r * 1.5,
              r: Math.max(0.5, this.r * (Math.random() * 0.22 + 0.15)),
              alpha: 0.6
            });
            if (this.trail.length > 18) {
              this.trail.shift();
            }
          }

          if (this.slideRemaining <= 0) {
            this.velocity *= 0.85;
            if (this.velocity < 0.2) {
              this.state = 'RESTING';
              this.restTimer = Math.floor(Math.random() * 240 + 100);
            }
          }
        }

        for (let i = 0; i < this.trail.length; i++) {
          this.trail[i].alpha *= 0.995;
        }

        if (this.y - this.r > height + 30) {
          this.reset(false);
        }
      }

      draw(c) {
        for (const t of this.trail) {
          if (t.alpha <= 0.05) continue;
          c.save();
          c.globalAlpha = t.alpha;

          c.beginPath();
          c.arc(t.x, t.y, t.r + 0.2, 0, Math.PI * 2);
          c.strokeStyle = "rgba(0, 0, 0, 0.4)";
          c.lineWidth = 0.5;
          c.stroke();

          c.beginPath();
          c.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, Math.max(0.3, t.r * 0.4), 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.85)";
          c.fill();

          c.restore();
        }

        c.save();

        const rx = this.r;
        const ry = this.r * (this.state === 'SLIDING' ? this.aspectY * 1.25 : this.aspectY);

        traceWaterBead(c, this.x, this.y, rx, ry, this.tilt);
        c.strokeStyle = "rgba(0, 0, 0, 0.5)";
        c.lineWidth = 0.75;
        c.stroke();

        const waterLens = c.createRadialGradient(
          this.x,
          this.y + ry * 0.3,
          rx * 0.2,
          this.x,
          this.y,
          ry
        );
        waterLens.addColorStop(0, "rgba(255, 255, 255, 0.1)");
        waterLens.addColorStop(0.7, "rgba(200, 240, 220, 0.05)");
        waterLens.addColorStop(0.95, "rgba(255, 255, 255, 0.25)");
        waterLens.addColorStop(1, "rgba(0, 0, 0, 0.25)");

        traceWaterBead(c, this.x, this.y, rx, ry, this.tilt);
        c.fillStyle = waterLens;
        c.fill();

        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.tilt);

        c.beginPath();
        c.ellipse(
          -rx * 0.3,
          -ry * 0.45,
          rx * 0.38,
          ry * 0.2,
          -0.25,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(255, 255, 255, 0.95)";
        c.fill();

        c.beginPath();
        c.ellipse(
          rx * 0.2,
          ry * 0.5,
          rx * 0.4,
          ry * 0.15,
          0.15,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(255, 255, 255, 0.4)";
        c.fill();

        c.restore();
        c.restore();
      }
    }

    for (let i = 0; i < maxActiveDrops; i++) {
      activeDrops.push(new SlidingDrop());
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.save();
        ctx.globalAlpha = d.alpha;

        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.rx, d.ry, d.angle, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.rx * 0.9, d.ry * 0.9, d.angle, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(d.x - d.rx * 0.3, d.y - d.ry * 0.3, Math.max(0.35, d.rx * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();

        ctx.restore();
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

