import { useEffect, useRef } from 'react'

function StarField({ theme = 'night' }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const stars = []
    const STAR_COUNT = 180

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const initializeStars = () => {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i += 1) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.8 + 0.4,
          speed: Math.random() * 0.12 + 0.03,
          alpha: Math.random() * 0.5 + 0.25,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const star of stars) {
        star.y += star.speed
        star.pulse += 0.01
        if (star.y > window.innerHeight + 5) {
          star.y = -5
          star.x = Math.random() * window.innerWidth
        }

        const twinkle = 0.25 * Math.sin(star.pulse) + star.alpha
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        
        if (theme === 'aurora') {
          ctx.fillStyle = `rgba(45, 212, 191, ${Math.max(0.08, twinkle * 0.8)})` // Teal-400
          ctx.shadowColor = 'rgba(45, 212, 191, 0.3)'
        } else if (theme === 'sunset') {
          ctx.fillStyle = `rgba(251, 146, 60, ${Math.max(0.08, twinkle * 0.8)})` // Orange-400
          ctx.shadowColor = 'rgba(251, 146, 60, 0.3)'
        } else if (theme === 'night') {
          ctx.fillStyle = `rgba(232, 121, 249, ${Math.max(0.08, twinkle * 0.8)})` // Magenta-400
          ctx.shadowColor = 'rgba(232, 121, 249, 0.3)'
        } else {
          // default light theme
          ctx.fillStyle = `rgba(255, 107, 107, ${Math.max(0.08, twinkle * 0.8)})` // app-accent (Rose)
          ctx.shadowColor = 'rgba(255, 107, 107, 0.3)'
        }
        
        ctx.shadowBlur = 10
        ctx.fill()
      }

      animationRef.current = window.requestAnimationFrame(animate)
    }

    resize()
    initializeStars()
    animate()

    const handleResize = () => {
      resize()
      initializeStars()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-90 pointer-events-none transition-colors duration-1000"
      aria-hidden="true"
    />
  )
}

export default StarField
