import { useEffect, useRef } from "react";

export default function RainyGlass({ backdropImage = "/rain_forest_bokeh.png" }) {
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

    // Static micro-droplets on the glass
    let staticDrops = [];
    const initStaticDrops = () => {
      staticDrops = [];
      const count = Math.floor((width * height) / 3800);
      for (let i = 0; i < count; i++) {
        // Organic non-circular shape parameters for static droplets
        const baseR = Math.random() * 2.2 + 0.6;
        staticDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          rx: baseR * (Math.random() * 0.35 + 0.85),
          ry: baseR * (Math.random() * 0.4 + 0.9), // slight gravity sag
          angle: (Math.random() - 0.5) * 0.6,      // subtle natural tilt
          alpha: Math.random() * 0.45 + 0.35,
        });
      }
    };
    initStaticDrops();

    // Helper: Draw natural organic water droplet contour (subtle egg/bead shape matching the background photo)
    const traceWaterBead = (c, x, y, rx, ry, tilt = 0) => {
      c.save();
      c.translate(x, y);
      c.rotate(tilt);

      c.beginPath();
      // Organic egg/water bead: slightly wider at bottom, slightly narrower at top
      c.moveTo(0, -ry);
      c.bezierCurveTo(rx * 0.9, -ry * 0.9, rx * 1.05, ry * 0.3, rx * 0.85, ry * 0.85);
      c.bezierCurveTo(rx * 0.5, ry * 1.05, -rx * 0.5, ry * 1.05, -rx * 0.85, ry * 0.85);
      c.bezierCurveTo(-rx * 1.05, ry * 0.3, -rx * 0.9, -ry * 0.9, 0, -ry);
      c.closePath();
      c.restore();
    };

    // Active sliding drops (gravity pulling them down glass with surface-tension grip)
    const activeDrops = [];
    const maxActiveDrops = Math.max(6, Math.floor(width / 180)); // Few, natural, crystal-clear water beads

    class SlidingDrop {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * (height * 0.85) : -25 - Math.random() * 50;
        this.r = Math.random() * 1.8 + 2.6; // Matches photo bead sizes (2.6 - 4.4px radius = 5-9px wide)
        this.tilt = (Math.random() - 0.5) * 0.15; // Subtle natural tilt
        this.aspectY = Math.random() * 0.3 + 1.25; // Organic elongation (1.25 - 1.55x height)

        // State Machine: 'RESTING' (stuck to glass) or 'SLIDING' (gentle slow trickle)
        this.state = 'RESTING';
        this.restTimer = Math.floor(Math.random() * 200 + (initial ? 30 : 120)); // Rest 2 - 5 seconds calmly
        this.slideRemaining = 0;
        this.velocity = 0;
        this.maxSlowSpeed = Math.random() * 0.5 + 0.7; // Very gentle authentic crawl
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

          // Leave faint, delicate micro-beads along the wet path
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

        // Fading of trail droplets
        for (let i = 0; i < this.trail.length; i++) {
          this.trail[i].alpha *= 0.995;
        }

        if (this.y - this.r > height + 30) {
          this.reset(false);
        }
      }

      draw(c) {
        // 1. Draw trail: very subtle, transparent wet moisture path
        for (const t of this.trail) {
          if (t.alpha <= 0.05) continue;
          c.save();
          c.globalAlpha = t.alpha;

          // Tiny dark meniscus rim
          c.beginPath();
          c.arc(t.x, t.y, t.r + 0.2, 0, Math.PI * 2);
          c.strokeStyle = "rgba(0, 0, 0, 0.4)";
          c.lineWidth = 0.5;
          c.stroke();

          // Clear water center with tiny glint
          c.beginPath();
          c.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, Math.max(0.3, t.r * 0.4), 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.85)";
          c.fill();

          c.restore();
        }

        // 2. Draw main droplet: 100% CRYSTAL-CLEAR water (no opaque grey/green paint!)
        c.save();

        const rx = this.r;
        const ry = this.r * (this.state === 'SLIDING' ? this.aspectY * 1.25 : this.aspectY);

        // Layer A: Thin Refractive Meniscus Shadow (Razor-thin edge definition)
        traceWaterBead(c, this.x, this.y, rx, ry, this.tilt);
        c.strokeStyle = "rgba(0, 0, 0, 0.5)";
        c.lineWidth = 0.75;
        c.stroke();

        // Layer B: Crystal-Clear Water Body (Transparent with soft bright rim)
        // Background photo shines right through the center!
        const waterLens = c.createRadialGradient(
          this.x,
          this.y + ry * 0.3,
          rx * 0.2,
          this.x,
          this.y,
          ry
        );
        waterLens.addColorStop(0, "rgba(255, 255, 255, 0.1)");     // pure transparent center
        waterLens.addColorStop(0.7, "rgba(200, 240, 220, 0.05)");  // subtle water tint
        waterLens.addColorStop(0.95, "rgba(255, 255, 255, 0.25)"); // bright internal reflection rim
        waterLens.addColorStop(1, "rgba(0, 0, 0, 0.25)");          // dark outer contour

        traceWaterBead(c, this.x, this.y, rx, ry, this.tilt);
        c.fillStyle = waterLens;
        c.fill();

        // Layer C: Primary Sharp Specular Glint (Top-left sky reflection)
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

        // Layer D: Secondary lower-opposite soft reflection (Caustic bounce)
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

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw static micro drops with organic water shapes & natural tilts
      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.save();
        ctx.globalAlpha = d.alpha;

        // Dark meniscus edge stroke (no solid opaque paint)
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.rx, d.ry, d.angle, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Soft bright inner rim (optical glass edge)
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.rx * 0.9, d.ry * 0.9, d.angle, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fill();

        // Pinpoint specular glint (light reflection)
        ctx.beginPath();
        ctx.arc(d.x - d.rx * 0.3, d.y - d.ry * 0.3, Math.max(0.35, d.rx * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();

        ctx.restore();
      }

      // 2. Update and draw active sliding drops
      for (let i = 0; i < activeDrops.length; i++) {
        const drop = activeDrops[i];
        drop.update();
        drop.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-[#061009]">
      {/* Crisp Full-Bleed Forest Backdrop - Fits Edge-to-Edge with Zero Gaps */}
      <img
        src={backdropImage}
        alt="Rain Glass Ambient Backdrop"
        className="absolute inset-0 w-full h-full object-cover object-[center_25%] scale-100 filter brightness-[1.2] contrast-[1.08] saturate-[1.08] [image-rendering:-webkit-optimize-contrast] transition-all duration-500"
      />

      {/* Subtle Sheen */}
      <div className="absolute inset-0 bg-[#08180E]/15" />

      {/* Physics-based Water Droplets & Falling Trails Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Smooth bottom transition edge into the next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-b from-transparent to-[#060907] pointer-events-none" />
    </div>
  );
}
