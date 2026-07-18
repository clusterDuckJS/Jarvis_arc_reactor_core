import type { EffectsState, ReactorModeDefinition, RgbColor } from "@/types/reactor";
import { mixRgb, rgbToCss } from "@/utils/color";

const TAU = Math.PI * 2;

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  drift: number;
  alpha: number;
}

export interface ReactorAnimationConfig {
  mode: ReactorModeDefinition;
  brightness: number;
  color: RgbColor;
  speed: number;
  power: boolean;
  effects: EffectsState;
  reducedMotion: boolean;
  highPerformance: boolean;
  showHud: boolean;
  variant: "splash" | "dashboard" | "compact";
}

export interface ReactorAnimationFrame {
  width: number;
  height: number;
  time: number;
  delta: number;
  dpr: number;
}

export interface ReactorFrameVariables {
  breathingPhase: number;
  plasmaNoise: number;
  magneticRotation: number;
  particleCount: number;
  arcIntensity: number;
}

export class ReactorAnimationEngine {
  private particles: Particle[] = [];
  private lastArcSeed = 0;

  render(
    ctx: CanvasRenderingContext2D,
    frame: ReactorAnimationFrame,
    config: ReactorAnimationConfig,
  ): ReactorFrameVariables {
    const { width, height, time } = frame;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * (config.variant === "compact" ? 0.37 : 0.39);
    const speed = config.reducedMotion ? 0.08 : 0.22 + config.speed / 180;
    const power = config.power ? 1 : 0.18;
    const brightness = (config.brightness / 255) * power;
    const breathingPhase = config.effects.breathing
      ? (Math.sin(time * config.mode.breathingSpeed * speed) + 1) / 2
      : 0.58;
    const pulse = 0.72 + breathingPhase * 0.28;
    const plasmaNoise = this.noise(time * 0.42, config.mode.noise);
    const magneticRotation = time * config.mode.rotationSpeed * speed;
    const arcIntensity = config.effects.electricalFlicker
      ? Math.max(0, Math.sin(time * 9.1) * 0.5 + this.noise(time * 1.8, 2.1) * 0.7)
      : 0.08;
    const visualColor = mixRgb(config.color, config.mode.primaryColor, 0.42);
    const secondary = config.mode.secondaryColor;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    this.drawGlow(ctx, centerX, centerY, radius, visualColor, secondary, brightness, pulse, config);
    this.drawBreathingCore(ctx, centerX, centerY, radius, visualColor, secondary, brightness, pulse, config);
    this.drawPlasma(ctx, centerX, centerY, radius, visualColor, secondary, time, plasmaNoise, brightness, config);
    this.drawMagneticField(ctx, centerX, centerY, radius, secondary, magneticRotation, brightness, config);
    const particleCount = this.drawParticles(ctx, frame, centerX, centerY, radius, visualColor, secondary, brightness, config);
    this.drawElectricalArcs(ctx, centerX, centerY, radius, visualColor, secondary, time, arcIntensity, brightness, config);

    ctx.globalCompositeOperation = "source-over";
    this.drawCasing(ctx, centerX, centerY, radius, visualColor, secondary, brightness, config);
    if (config.showHud) {
      this.drawHud(ctx, centerX, centerY, radius, time, secondary, brightness, config);
    }

    ctx.restore();

    return {
      breathingPhase,
      plasmaNoise,
      magneticRotation,
      particleCount,
      arcIntensity,
    };
  }

  private drawGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    brightness: number,
    pulse: number,
    config: ReactorAnimationConfig,
  ): void {
    const bloomRadius = radius * (2.1 + config.mode.bloom * 0.7);
    const gradient = ctx.createRadialGradient(x, y, radius * 0.08, x, y, bloomRadius);
    gradient.addColorStop(0, rgbToCss(secondary, 0.64 * brightness));
    gradient.addColorStop(0.24, rgbToCss(primary, 0.28 * brightness * pulse));
    gradient.addColorStop(0.58, rgbToCss(primary, 0.08 * brightness));
    gradient.addColorStop(1, "rgba(9, 11, 16, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, bloomRadius, 0, TAU);
    ctx.fill();
  }

  private drawBreathingCore(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    brightness: number,
    pulse: number,
    config: ReactorAnimationConfig,
  ): void {
    const coreRadius = radius * (0.22 + pulse * 0.025);
    const gradient = ctx.createRadialGradient(x, y, coreRadius * 0.08, x, y, coreRadius * 1.25);
    gradient.addColorStop(0, rgbToCss({ r: 255, g: 255, b: 255 }, brightness));
    gradient.addColorStop(0.24, rgbToCss(secondary, 0.9 * brightness));
    gradient.addColorStop(0.72, rgbToCss(primary, 0.46 * brightness));
    gradient.addColorStop(1, "rgba(97, 232, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, coreRadius * 1.35, 0, TAU);
    ctx.fill();

    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.strokeStyle = rgbToCss(secondary, 0.54 * brightness);
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.3, 0, TAU);
    ctx.stroke();

    const spokes = config.variant === "compact" ? 8 : 12;
    for (let index = 0; index < spokes; index += 1) {
      const angle = (index / spokes) * TAU;
      const inner = radius * 0.36;
      const outer = radius * 0.78;
      const alpha = 0.16 + 0.18 * Math.sin(index + pulse * TAU);

      ctx.strokeStyle = rgbToCss(primary, alpha * brightness);
      ctx.lineWidth = Math.max(1, radius * 0.006);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      ctx.stroke();
    }
  }

  private drawPlasma(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    time: number,
    plasmaNoise: number,
    brightness: number,
    config: ReactorAnimationConfig,
  ): void {
    if (!config.effects.livingPlasma) {
      return;
    }

    const strands = config.highPerformance ? 22 : 14;
    for (let index = 0; index < strands; index += 1) {
      const base = (index / strands) * TAU + time * 0.18;
      const wobble = Math.sin(time * (0.6 + index * 0.03) + index) * 0.22 * config.mode.noise;
      const start = radius * (0.36 + Math.sin(index) * 0.02);
      const end = radius * (0.9 + plasmaNoise * 0.09);
      const control = radius * (0.64 + Math.cos(index * 1.7 + time) * 0.08);
      const angle = base + wobble;

      ctx.strokeStyle = rgbToCss(index % 3 === 0 ? secondary : primary, (0.08 + plasmaNoise * 0.16) * brightness);
      ctx.lineWidth = Math.max(1, radius * (0.006 + plasmaNoise * 0.004));
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * start, y + Math.sin(angle) * start);
      ctx.quadraticCurveTo(
        x + Math.cos(angle + wobble * 1.8) * control,
        y + Math.sin(angle - wobble * 1.4) * control,
        x + Math.cos(angle + wobble * 0.5) * end,
        y + Math.sin(angle + wobble * 0.5) * end,
      );
      ctx.stroke();
    }
  }

  private drawMagneticField(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: RgbColor,
    rotation: number,
    brightness: number,
    config: ReactorAnimationConfig,
  ): void {
    const rings = config.variant === "compact" ? 3 : 5;
    ctx.lineCap = "round";

    for (let ring = 0; ring < rings; ring += 1) {
      const ringRadius = radius * (0.48 + ring * 0.12);
      const segments = 6 + ring * 2;
      const direction = ring % 2 === 0 ? 1 : -1;

      ctx.lineWidth = Math.max(1, radius * (0.008 - ring * 0.0007));
      ctx.strokeStyle = rgbToCss(color, (0.18 - ring * 0.018) * brightness);

      for (let segment = 0; segment < segments; segment += 1) {
        const start = rotation * direction + (segment / segments) * TAU;
        const length = TAU / segments * (0.38 + config.mode.noise * 0.2);

        ctx.beginPath();
        ctx.arc(x, y, ringRadius, start, start + length);
        ctx.stroke();
      }
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    frame: ReactorAnimationFrame,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    brightness: number,
    config: ReactorAnimationConfig,
  ): number {
    const density = config.effects.livingPlasma ? config.mode.particleDensity : 0.18;
    const target = Math.round((config.highPerformance ? 150 : 86) * density * Math.max(0.35, brightness));

    this.ensureParticles(target, radius);
    ctx.fillStyle = rgbToCss(secondary, 0.72 * brightness);

    for (const particle of this.particles) {
      const fieldSpeed = config.effects.rotatingPlasma ? particle.speed : particle.speed * 0.2;
      particle.angle += frame.delta * 0.001 * fieldSpeed * (0.5 + config.speed / 200);
      particle.radius += Math.sin(frame.time * particle.drift + particle.angle) * 0.012;

      const px = x + Math.cos(particle.angle) * particle.radius;
      const py = y + Math.sin(particle.angle) * particle.radius;
      const alpha = particle.alpha * brightness * (0.55 + Math.sin(frame.time * particle.drift) * 0.25);

      ctx.fillStyle = rgbToCss(Math.random() > 0.74 ? secondary : primary, alpha);
      ctx.beginPath();
      ctx.arc(px, py, particle.size, 0, TAU);
      ctx.fill();
    }

    return this.particles.length;
  }

  private drawElectricalArcs(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    time: number,
    intensity: number,
    brightness: number,
    config: ReactorAnimationConfig,
  ): void {
    if (!config.effects.electricalFlicker || intensity < 0.28) {
      return;
    }

    const seed = Math.floor(time * 18);
    if (seed !== this.lastArcSeed) {
      this.lastArcSeed = seed;
    }

    const arcs = config.highPerformance ? 5 : 3;
    for (let arc = 0; arc < arcs; arc += 1) {
      const startAngle = this.random(seed + arc) * TAU;
      const arcLength = 0.28 + this.random(seed + arc * 7) * 0.46;
      const segments = 6;
      const inner = radius * (0.42 + this.random(seed + arc * 11) * 0.18);
      const outer = radius * (0.78 + this.random(seed + arc * 13) * 0.14);

      ctx.strokeStyle = rgbToCss(arc % 2 === 0 ? secondary : primary, 0.18 * brightness * intensity);
      ctx.lineWidth = Math.max(1, radius * 0.007);
      ctx.beginPath();

      for (let point = 0; point <= segments; point += 1) {
        const amount = point / segments;
        const angle = startAngle + arcLength * amount;
        const jag = (this.random(seed + arc * 31 + point) - 0.5) * radius * 0.1;
        const currentRadius = inner + (outer - inner) * amount + jag;
        const px = x + Math.cos(angle) * currentRadius;
        const py = y + Math.sin(angle) * currentRadius;

        if (point === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.stroke();
    }
  }

  private drawCasing(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    primary: RgbColor,
    secondary: RgbColor,
    brightness: number,
    config: ReactorAnimationConfig,
  ): void {
    const outer = radius * 1.02;
    const inner = radius * 0.84;

    ctx.lineWidth = Math.max(1, radius * 0.018);
    ctx.strokeStyle = "rgba(221, 254, 255, 0.16)";
    ctx.beginPath();
    ctx.arc(x, y, outer, 0, TAU);
    ctx.stroke();

    ctx.lineWidth = Math.max(1, radius * 0.008);
    ctx.strokeStyle = rgbToCss(secondary, 0.34 * brightness);
    ctx.beginPath();
    ctx.arc(x, y, inner, 0, TAU);
    ctx.stroke();

    const notches = config.variant === "compact" ? 16 : 32;
    for (let index = 0; index < notches; index += 1) {
      const angle = (index / notches) * TAU;
      const length = index % 4 === 0 ? radius * 0.09 : radius * 0.045;
      ctx.strokeStyle = rgbToCss(index % 4 === 0 ? secondary : primary, (0.18 + brightness * 0.12));
      ctx.lineWidth = Math.max(1, radius * 0.005);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * (outer - length), y + Math.sin(angle) * (outer - length));
      ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      ctx.stroke();
    }
  }

  private drawHud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    time: number,
    color: RgbColor,
    brightness: number,
    config: ReactorAnimationConfig,
  ): void {
    ctx.save();
    ctx.strokeStyle = rgbToCss(color, 0.18 * brightness);
    ctx.fillStyle = rgbToCss(color, 0.55 * brightness);
    ctx.lineWidth = 1;
    ctx.font = `${Math.max(9, radius * 0.045)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labelRadius = radius * 1.22;
    const labels = config.variant === "dashboard" ? ["CORE", "FIELD", "BLE", "C3"] : ["OS", "ARC"];
    labels.forEach((label, index) => {
      const angle = (index / labels.length) * TAU + time * 0.04;
      ctx.fillText(label, x + Math.cos(angle) * labelRadius, y + Math.sin(angle) * labelRadius);
    });

    ctx.restore();
  }

  private ensureParticles(target: number, radius: number): void {
    while (this.particles.length < target) {
      this.particles.push({
        angle: Math.random() * TAU,
        radius: radius * (0.42 + Math.random() * 0.56),
        speed: (Math.random() * 1.4 + 0.4) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 1.8 + 0.45,
        drift: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.42 + 0.16,
      });
    }

    if (this.particles.length > target) {
      this.particles.splice(target);
    }
  }

  private noise(value: number, salt: number): number {
    return (Math.sin(value * 2.17 + salt) + Math.sin(value * 0.73 + salt * 2.1)) / 4 + 0.5;
  }

  private random(seed: number): number {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }
}
