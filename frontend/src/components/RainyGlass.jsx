import { useEffect, useRef } from "react";

export default function RainyGlass({ backdropImage = "/rain_forest_bokeh.png" }) {
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

    // Static micro-droplets on the glass
    let staticDrops = [];
    const initStaticDrops = () => {
      staticDrops = [];
      const count = Math.floor((width * height) / 3800);
      for (let i = 0; i < count; i++) {
        staticDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 2.2 + 0.6,
          alpha: Math.random() * 0.45 + 0.35,
        });
      }
    };
    initStaticDrops();

    // Active sliding drops (gravity pulling them down glass)
    const activeDrops = [];
    const maxActiveDrops = Math.max(18, Math.floor(width / 70));

    class SlidingDrop {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -20 - Math.random() * 80;
        this.r = Math.random() * 3.5 + 2.5; // radius
        this.speed = Math.random() * 1.8 + 0.8;
        this.acc = 0;
        this.tension = Math.random() * 0.04 + 0.01; // surface friction
        this.trail = [];
        this.trailTimer = 0;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.wobble += this.wobbleSpeed;
        
        // Surface tension simulation: stutter / sliding in bursts
        if (Math.random() < 0.03) {
          this.speed = Math.max(0.2, this.speed * 0.4);
        } else if (Math.random() < 0.06) {
          this.speed = Math.min(6.5, this.speed + 1.2);
        }

        this.y += this.speed;
        this.x += Math.sin(this.wobble) * 0.35;

        // Leave tiny trail droplets behind
        this.trailTimer++;
        if (this.trailTimer % 7 === 0 && Math.random() < 0.8) {
          this.trail.push({
            x: this.x + (Math.random() - 0.5) * 1.5,
            y: this.y - this.r,
            r: Math.max(0.6, this.r * (Math.random() * 0.35 + 0.2)),
            alpha: 0.65,
          });
          if (this.trail.length > 25) {
            this.trail.shift();
          }
        }

        // Fade trail droplets
        for (let i = 0; i < this.trail.length; i++) {
          this.trail[i].alpha *= 0.992;
        }

        if (this.y - this.r > height + 20) {
          this.reset();
        }
      }

      draw(c) {
        // 1. Draw trail droplets (beaded water droplets left behind the slide)
        for (const t of this.trail) {
          if (t.alpha <= 0.05) continue;
          c.save();
          c.globalAlpha = Math.min(1, t.alpha);

          // Dark meniscus boundary
          c.beginPath();
          c.arc(t.x, t.y, t.r, 0, Math.PI * 2);
          c.fillStyle = "rgba(0, 0, 0, 0.55)";
          c.fill();

          // Internal water refraction (bottom caustic)
          const tGrad = c.createRadialGradient(
            t.x,
            t.y + t.r * 0.35,
            0.1,
            t.x,
            t.y,
            t.r * 0.95
          );
          tGrad.addColorStop(0, "rgba(220, 245, 235, 0.45)");
          tGrad.addColorStop(0.5, "rgba(50, 80, 65, 0.2)");
          tGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
          c.beginPath();
          c.arc(t.x, t.y, t.r * 0.9, 0, Math.PI * 2);
          c.fillStyle = tGrad;
          c.fill();

          // Sharp specular glint
          c.beginPath();
          c.arc(t.x - t.r * 0.32, t.y - t.r * 0.32, Math.max(0.4, t.r * 0.32), 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.95)";
          c.fill();

          c.restore();
        }

        // 2. Draw main sliding droplet with true optical water refraction
        c.save();

        const stretch = Math.min(1.5, 1 + this.speed * 0.08);
        const rx = this.r;
        const ry = this.r * stretch;

        // Layer A: Dark Refraction Rim (Meniscus Edge)
        c.beginPath();
        c.ellipse(this.x, this.y, rx + 0.6, ry + 0.6, 0, 0, Math.PI * 2);
        c.fillStyle = "rgba(0, 0, 0, 0.65)";
        c.fill();

        // Layer B: Glass/Water Lens Refraction Body
        // Water acts as a convex lens: darker upper half, bright luminous bottom caustic
        const dropGrad = c.createLinearGradient(
          this.x,
          this.y - ry,
          this.x,
          this.y + ry
        );
        dropGrad.addColorStop(0, "rgba(10, 25, 18, 0.75)");   // upper dark refraction shadow
        dropGrad.addColorStop(0.4, "rgba(30, 60, 45, 0.3)");   // body transition
        dropGrad.addColorStop(0.75, "rgba(180, 230, 210, 0.45)"); // focused caustic glow
        dropGrad.addColorStop(1, "rgba(240, 255, 245, 0.7)");     // bright lower optical edge

        c.beginPath();
        c.ellipse(this.x, this.y, rx, ry, 0, 0, Math.PI * 2);
        c.fillStyle = dropGrad;
        c.fill();

        // Layer C: Secondary internal ambient depth
        const depthGrad = c.createRadialGradient(
          this.x - rx * 0.25,
          this.y - ry * 0.3,
          rx * 0.1,
          this.x,
          this.y + ry * 0.2,
          ry
        );
        depthGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
        depthGrad.addColorStop(0.6, "transparent");
        depthGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
        c.beginPath();
        c.ellipse(this.x, this.y, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
        c.fillStyle = depthGrad;
        c.fill();

        // Layer D: Primary Sharp Specular Glint (Light from above)
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

        // Layer E: Secondary micro-pinpoint glint
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

        // Layer F: Delicate Bottom Caustic Rim Reflection
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

    // Animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw static micro drops with optical water refraction
      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.save();
        ctx.globalAlpha = d.alpha;

        // Dark meniscus edge shadow
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fill();

        // Lens refraction body: dark top shadow, bright bottom caustic
        const g = ctx.createLinearGradient(d.x, d.y - d.r, d.x, d.y + d.r);
        g.addColorStop(0, "rgba(10, 25, 18, 0.7)");
        g.addColorStop(0.5, "rgba(40, 70, 55, 0.25)");
        g.addColorStop(1, "rgba(230, 255, 240, 0.55)");
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Pinpoint specular glint
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.32, d.y - d.r * 0.32, Math.max(0.4, d.r * 0.32), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
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
