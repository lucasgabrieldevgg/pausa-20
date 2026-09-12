'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {/* A troca de ícone acontece via CSS — sem risco de mismatch de hidratação */}
      <Sun className="h-[1.2rem] w-[1.2rem] dark:hidden" aria-hidden="true" />
      <Moon
        className="hidden h-[1.2rem] w-[1.2rem] dark:block"
        aria-hidden="true"
      />
    </Button>
  )
}
