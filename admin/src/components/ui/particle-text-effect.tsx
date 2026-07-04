"use client"

import { useEffect, useRef } from "react"

interface Vector2D {
    x: number
    y: number
}

class Particle {
    pos: Vector2D = { x: 0, y: 0 }
    vel: Vector2D = { x: 0, y: 0 }
    acc: Vector2D = { x: 0, y: 0 }
    target: Vector2D = { x: 0, y: 0 }

    closeEnoughTarget = 50
    maxSpeed = 15.0 // Super fast snap
    maxForce = 1.5
    particleSize = 3.5
    isKilled = false

    startColor = { r: 13, g: 148, b: 136 } // Teal-600
    targetColor = { r: 6, g: 182, b: 212 } // Cyan-500
    colorWeight = 0
    colorBlendRate = 0.02

    constructor(x: number, y: number) {
        this.pos.x = x
        this.pos.y = y
    }

    move() {
        // Check distance to target
        const dx = this.target.x - this.pos.x
        const dy = this.target.y - this.pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        let proximityMult = 1
        if (distance < this.closeEnoughTarget) {
            proximityMult = distance / this.closeEnoughTarget
        }

        // Steering logic
        const desiredX = (dx / distance) * this.maxSpeed * proximityMult
        const desiredY = (dy / distance) * this.maxSpeed * proximityMult

        const steerX = desiredX - this.vel.x
        const steerY = desiredY - this.vel.y

        // Limit steer force
        const steerMag = Math.sqrt(steerX * steerX + steerY * steerY)
        if (steerMag > this.maxForce) {
            this.acc.x += (steerX / steerMag) * this.maxForce
            this.acc.y += (steerY / steerMag) * this.maxForce
        } else {
            this.acc.x += steerX
            this.acc.y += steerY
        }

        this.vel.x += this.acc.x
        this.vel.y += this.acc.y
        this.pos.x += this.vel.x
        this.pos.y += this.vel.y
        this.acc.x = 0
        this.acc.y = 0

        // Friction
        this.vel.x *= 0.95
        this.vel.y *= 0.95
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.colorWeight < 1.0) {
            this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
        }

        const r = Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight)
        const g = Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight)
        const b = Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight)

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

        // Glow effect
        ctx.shadowBlur = 4
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`

        ctx.beginPath()
        ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0 // Reset for performance
    }

    kill(width: number, height: number) {
        if (!this.isKilled) {
            const angle = Math.random() * Math.PI * 2
            const dist = (width + height)
            this.target.x = width / 2 + Math.cos(angle) * dist
            this.target.y = height / 2 + Math.sin(angle) * dist
            this.isKilled = true
        }
    }
}

interface ParticleTextEffectProps {
    words?: string[]
}

const DEFAULT_WORDS = ["GIET", "GRIEVANCE", "ADMIN", "PORTAL"]

export function ParticleTextEffect({ words = DEFAULT_WORDS }: ParticleTextEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | undefined>(undefined)
    const particlesRef = useRef<Particle[]>([])
    const wordIndexRef = useRef(0)
    const countRef = useRef(0)

    const nextWord = (word: string, canvas: HTMLCanvasElement) => {
        // Create off-screen canvas for text rendering
        const offscreen = document.createElement("canvas")
        offscreen.width = canvas.width
        offscreen.height = canvas.height
        const oCtx = offscreen.getContext("2d")!

        oCtx.fillStyle = "white"

        // Dynamically calculate font size to fit neatly in the canvas container
        let fontSize = canvas.height * 0.8
        oCtx.font = `900 ${fontSize}px "Outfit", "Inter", sans-serif`
        let metrics = oCtx.measureText(word)

        // Scale down if the word is too wide
        if (metrics.width > canvas.width * 0.9) {
            fontSize = (canvas.width * 0.9 / metrics.width) * fontSize
            oCtx.font = `900 ${fontSize}px "Outfit", "Inter", sans-serif`
        }

        oCtx.textAlign = "center"
        oCtx.textBaseline = "middle"
        // Fill text right in the true center of the canvas dynamically
        oCtx.fillText(word, canvas.width / 2, canvas.height / 2)

        const imageData = oCtx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        const step = 6 // Density of particles (lower is more dense)

        let particleIndex = 0
        const particles = particlesRef.current

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const index = (y * canvas.width + x) * 4
                if (pixels[index + 3] > 128) {
                    let p: Particle
                    if (particleIndex < particles.length) {
                        p = particles[particleIndex]
                        p.isKilled = false
                    } else {
                        // Spawn from center for a cool explosion-outward effect
                        p = new Particle(canvas.width / 2, canvas.height / 2)
                        // Give them a random initial burst velocity
                        p.vel.x = (Math.random() - 0.5) * 25
                        p.vel.y = (Math.random() - 0.5) * 25
                        particles.push(p)
                    }
                    p.target.x = x
                    p.target.y = y

                    // Transition to specific theme colors
                    p.startColor = { ...p.targetColor }
                    p.targetColor = wordIndexRef.current % 2 === 0
                        ? { r: 13, g: 148, b: 136 } // Teal-600
                        : { r: 6, g: 182, b: 212 } // Cyan-500
                    p.colorWeight = 0

                    particleIndex++
                }
            }
        }

        // Kill extra particles
        for (let i = particleIndex; i < particles.length; i++) {
            particles[i].kill(canvas.width, canvas.height)
        }
    }

    const animate = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const particles = particlesRef.current
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            p.move()
            p.draw(ctx)

            if (p.isKilled) {
                const dist = Math.sqrt(Math.pow(p.pos.x - canvas.width / 2, 2) + Math.pow(p.pos.y - canvas.height / 2, 2))
                if (dist > (canvas.width + canvas.height)) {
                    particles.splice(i, 1)
                }
            }
        }

        countRef.current++
        if (countRef.current % 180 === 0) { // Cycle words every 3 seconds
            wordIndexRef.current = (wordIndexRef.current + 1) % words.length
            nextWord(words[wordIndexRef.current], canvas)
        }

        animationRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const handleResize = () => {
            const parent = canvas.parentElement
            if (parent) {
                canvas.width = parent.clientWidth
                canvas.height = parent.clientHeight
            } else {
                canvas.width = window.innerWidth
                canvas.height = 160 // Fallback
            }
            nextWord(words[wordIndexRef.current], canvas)
        }

        window.addEventListener('resize', handleResize)
        handleResize()
        animate()

        return () => {
            window.removeEventListener('resize', handleResize)
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [words])

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
        />
    )
}
