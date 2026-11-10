import React, { useEffect, useRef } from 'react'
import forkliftWebm from '../../assets/forklift.webm'
import forkliftMp4 from '../../assets/forklift.mp4'
import { loopFade } from '../../utils/loopFade'

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Vídeo decorativo da empilhadeira em loop, com fade nas bordas do loop. Parado em reduced-motion. */
const ForkliftLoop: React.FC<{ className?: string }> = ({ className }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const still = prefersReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (still) {
      video.style.opacity = '1'
      return
    }
    let frame = requestAnimationFrame(function tick() {
      video.style.opacity = String(loopFade(video.currentTime, video.duration))
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [still])

  return (
    <video ref={videoRef} className={className} autoPlay={!still} loop muted playsInline aria-hidden="true">
      <source src={forkliftWebm} type="video/webm" />
      <source src={forkliftMp4} type="video/mp4" />
    </video>
  )
}

export default ForkliftLoop
