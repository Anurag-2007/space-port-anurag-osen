"use client"

import { useSounds } from "./sound-engine"

interface CTAButtonsProps {
  visible: boolean
}

export function CTAButtons({ visible }: CTAButtonsProps) {
  const sounds = useSounds()

  const buttons = [
    {
      label: "RESUME",
      href: "#resume",
      icon: "📋",
      color: "text-primary",
    },
    {
      label: "GITHUB",
      href: "https://github.com",
      icon: "⚙️",
      color: "text-accent",
    },
    {
      label: "CONTACT",
      href: "mailto:anurag@example.com",
      icon: "📡",
      color: "text-chart-4",
    },
  ]

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto">
      {buttons.map((btn, i) => (
        <a
          key={i}
          href={btn.href}
          target={btn.href.startsWith("http") ? "_blank" : undefined}
          rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={() => sounds.play("click")}
          className="glass-panel rounded px-3 py-2 flex items-center gap-2 hover:border-primary/40 transition-all duration-300 group hover:scale-105"
          aria-label={btn.label}
        >
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
            {btn.label}
          </span>
          <span className={`text-xs ${btn.color}`}>{btn.icon}</span>
        </a>
      ))}
    </div>
  )
}
