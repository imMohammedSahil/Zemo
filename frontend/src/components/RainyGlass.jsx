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
        // Draw trail droplets first
        for (const t of this.trail) {
          if (t.alpha <= 0.05) continue;
          c.save();
          c.globalAlpha = t.alpha;

          // Droplet body
          c.beginPath();
          c.arc(t.x, t.y, t.r, 0, Math.PI * 2);
          c.fillStyle = "rgba(180, 220, 200, 0.25)";
          c.fill();

          // Droplet specular highlight
          c.beginPath();
          c.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.35, 0, Math.PI * 2);
          c.fillStyle = "rgba(255, 255, 255, 0.75)";
          c.fill();

          c.restore();
        }

        // Draw main sliding droplet
        c.save();
        
        // Tear-drop elongated shape
        const stretch = Math.min(1.6, 1 + this.speed * 0.1);
        c.beginPath();
        c.ellipse(this.x, this.y, this.r, this.r * stretch, 0, 0, Math.PI * 2);
        
        // Realistic glass refraction gradient
        const grad = c.createRadialGradient(
          this.x - this.r * 0.2,
          this.y - this.r * 0.3,
          this.r * 0.1,
          this.x,
          this.y,
          this.r * 1.2
        );
        grad.addColorStop(0, "rgba(220, 255, 230, 0.35)");
        grad.addColorStop(0.6, "rgba(20, 45, 30, 0.4)");
        grad.addColorStop(0.9, "rgba(5, 15, 10, 0.7)");
        grad.addColorStop(1, "rgba(206, 255, 0, 0.2)"); // subtle acid edge tint
        c.fillStyle = grad;
        c.fill();

        // Droplet rim shadow
        c.strokeStyle = "rgba(0, 0, 0, 0.45)";
        c.lineWidth = 0.75;
        c.stroke();

        // Top specular reflection (light source from above)
        c.beginPath();
        c.ellipse(
          this.x - this.r * 0.25,
          this.y - this.r * stretch * 0.35,
          this.r * 0.35,
          this.r * 0.2,
          -0.2,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(255, 255, 255, 0.85)";
        c.fill();

        // Bottom refraction reflection
        c.beginPath();
        c.ellipse(
          this.x + this.r * 0.2,
          this.y + this.r * stretch * 0.4,
          this.r * 0.3,
          this.r * 0.15,
          0.2,
          0,
          Math.PI * 2
        );
        c.fillStyle = "rgba(206, 255, 0, 0.45)";
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

      // 1. Draw static micro drops
      for (let i = 0; i < staticDrops.length; i++) {
        const d = staticDrops[i];
        ctx.save();
        ctx.globalAlpha = d.alpha;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200, 240, 220, 0.2)";
        ctx.fill();

        // Specular dot
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
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
