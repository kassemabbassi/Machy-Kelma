"use client"

export class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled = true

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  async initialize() {
    if (!this.audioContext) return

    // Create sound effects programmatically
    await this.createSounds()
  }

  private async createSounds() {
    if (!this.audioContext) return

    // Word found sound
    const wordFoundBuffer = this.createTone(800, 0.2, "sine")
    this.sounds.set("wordFound", wordFoundBuffer)

    // Combo sound
    const comboBuffer = this.createTone(1200, 0.3, "square")
    this.sounds.set("combo", comboBuffer)

    // Game over sound
    const gameOverBuffer = this.createTone(400, 0.5, "sawtooth")
    this.sounds.set("gameOver", gameOverBuffer)

    // Victory sound
    const victoryBuffer = this.createChord([523, 659, 784], 1.0)
    this.sounds.set("victory", victoryBuffer)

    // Tick sound
    const tickBuffer = this.createTone(1000, 0.1, "sine")
    this.sounds.set("tick", tickBuffer)
  }

  private createTone(frequency: number, duration: number, type: OscillatorType): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not available")

    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let value = 0

      switch (type) {
        case "sine":
          value = Math.sin(2 * Math.PI * frequency * t)
          break
        case "square":
          value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
        case "sawtooth":
          value = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
          break
      }

      // Apply envelope
      const envelope = Math.exp(-t * 3)
      data[i] = value * envelope * 0.3
    }

    return buffer
  }

  private createChord(frequencies: number[], duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not available")

    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let value = 0

      frequencies.forEach((freq) => {
        value += Math.sin(2 * Math.PI * freq * t)
      })

      value /= frequencies.length
      const envelope = Math.exp(-t * 2)
      data[i] = value * envelope * 0.2
    }

    return buffer
  }

  play(soundName: string, volume = 1) {
    if (!this.enabled || !this.audioContext || !this.sounds.has(soundName)) return

    const buffer = this.sounds.get(soundName)!
    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()

    source.buffer = buffer
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    source.start()
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }
}

export const soundManager = new SoundManager()
