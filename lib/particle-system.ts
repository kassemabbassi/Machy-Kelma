export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: "spark" | "star" | "confetti" | "word"
  text?: string
}

export class ParticleSystem {
  private particles: Particle[] = []
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private animationId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")
    this.startAnimation()
  }

  createWordFoundExplosion(x: number, y: number, word: string, score: number) {
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"]

    // Create sparks
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        id: `spark-${Date.now()}-${i}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: "spark",
      })
    }

    // Create word particle
    this.particles.push({
      id: `word-${Date.now()}`,
      x,
      y: y - 20,
      vx: 0,
      vy: -2,
      life: 120,
      maxLife: 120,
      size: 16,
      color: "#10B981",
      type: "word",
      text: `+${score}`,
    })

    // Create stars
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: `star-${Date.now()}-${i}`,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 90,
        maxLife: 90,
        size: Math.random() * 6 + 4,
        color: "#F59E0B",
        type: "star",
      })
    }
  }

  createComboExplosion(x: number, y: number, combo: number) {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]

    for (let i = 0; i < combo * 5; i++) {
      this.particles.push({
        id: `combo-${Date.now()}-${i}`,
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 80,
        maxLife: 80,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: "confetti",
      })
    }
  }

  private startAnimation() {
    const animate = () => {
      if (!this.ctx || !this.canvas) return

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      this.particles = this.particles.filter((particle) => {
        particle.life--
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.1 // gravity

        const alpha = particle.life / particle.maxLife

        this.ctx!.save()
        this.ctx!.globalAlpha = alpha

        if (particle.type === "word" && particle.text) {
          this.ctx!.font = `bold ${particle.size}px Inter`
          this.ctx!.fillStyle = particle.color
          this.ctx!.textAlign = "center"
          this.ctx!.fillText(particle.text, particle.x, particle.y)
        } else if (particle.type === "star") {
          this.drawStar(particle.x, particle.y, particle.size, particle.color)
        } else {
          this.ctx!.fillStyle = particle.color
          this.ctx!.beginPath()
          this.ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          this.ctx!.fill()
        }

        this.ctx!.restore()

        return particle.life > 0
      })

      this.animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  private drawStar(x: number, y: number, size: number, color: string) {
    if (!this.ctx) return

    this.ctx.fillStyle = color
    this.ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5
      const x1 = x + Math.cos(angle) * size
      const y1 = y + Math.sin(angle) * size
      if (i === 0) this.ctx.moveTo(x1, y1)
      else this.ctx.lineTo(x1, y1)
    }
    this.ctx.closePath()
    this.ctx.fill()
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}
