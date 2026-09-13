'use client'

import {
  Bell,
  BellOff,
  FlaskConical,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { CHALLENGES } from '@/lib/challenges'
import type { AlarmDuration, EyeBreakSettings } from '@/hooks/use-eye-break'
import { ALARM_SOUNDS, previewAlarm, primeAudio, type AlarmSoundId } from '@/lib/sound'

interface SettingsPanelProps {
  settings: EyeBreakSettings
  onChange: (patch: Partial<EyeBreakSettings>) => void
  onRequestNotifications: () => Promise<
    'granted' | 'denied' | 'default' | 'unsupported'
  >
  onTestAlert: () => void
}

const INTERVALS = [5, 10, 15, 20, 30, 45, 60] as const

const ALARM_DURATION_OPTIONS: ReadonlyArray<{
  value: AlarmDuration
  label: string
}> = [
  { value: 'until-off', label: '🔁 Toca até eu desligar' },
  { value: 5, label: '5 segundos' },
  { value: 10, label: '10 segundos' },
  { value: 15, label: '15 segundos' },
  { value: 30, label: '30 segundos' },
  { value: 60, label: '1 minuto' },
]

export function SettingsPanel({
  settings,
  onChange,
  onRequestNotifications,
  onTestAlert,
}: SettingsPanelProps) {
  const [permission, setPermission] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const disabledSet = new Set(settings.disabledChallenges)
  const disabledCount = disabledSet.size
  const enabledCount = CHALLENGES.length - disabledCount

  const toggleChallenge = (id: number) => {
    const next = new Set(disabledSet)
    if (next.has(id)) {
      next.delete(id)
    } else {
      // mantém sempre pelo menos 1 desafio ativo
      if (enabledCount <= 1) return
      next.add(id)
    }
    onChange({ disabledChallenges: [...next] })
  }

  const enableAllChallenges = () => {
    onChange({ disabledChallenges: [] })
  }

  const handleNotificationToggle = async (checked: boolean) => {
    if (!checked) {
      onChange({ notifications: false })
      return
    }
    const result = await onRequestNotifications()
    setPermission(result)
    onChange({ notifications: result === 'granted' })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir configurações">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>
            Ajuste o ritmo das pausas do jeito que funciona para você.
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-fine flex flex-col gap-6 overflow-y-auto px-4 pb-6">
          {/* Intervalo */}
          <div className="space-y-2">
            <Label htmlFor="interval">Avisar a cada</Label>
            <Select
              value={String(settings.intervalMinutes)}
              onValueChange={(value) =>
                onChange({ intervalMinutes: Number(value) })
              }
            >
              <SelectTrigger id="interval" className="w-full">
                <SelectValue placeholder="Escolha o intervalo" />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((min) => (
                  <SelectItem key={min} value={String(min)}>
                    {min === 20 ? '20 minutos (recomendado)' : `${min} minutos`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O ideal, pela regra 20-20-20, é pausar a cada 20 minutos ou
              menos. Prefere interrupções menos frequentes? Os intervalos
              maiores estão aí — mas 20 min segue o recomendado.
            </p>
          </div>

          {/* Modo */}
          <div className="space-y-2">
            <Label htmlFor="mode">Estilo do aviso</Label>
            <Select
              value={settings.mode}
              onValueChange={(value) =>
                onChange({ mode: value as EyeBreakSettings['mode'] })
              }
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue placeholder="Escolha o estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="challenge">🎯 Desafio guiado</SelectItem>
                <SelectItem value="simple">🔔 Só avisar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.mode === 'challenge'
                ? 'Um desafio rápido em tela cheia com contagem de 20s.'
                : 'Apenas um aviso discreto na tela, sem interromper.'}
            </p>
          </div>

          {/* Desafios personalizados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Desafios</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {CHALLENGES.length - disabledCount} de {CHALLENGES.length}{' '}
                ativos
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Marque só os desafios que você consegue (e quer) fazer — os
              desmarcados nunca aparecem no sorteio.
            </p>
            <div className="scrollbar-fine max-h-72 space-y-0.5 overflow-y-auto rounded-lg border p-1.5">
              {CHALLENGES.map((c) => {
                const checked = !disabledSet.has(c.id)
                const isLastEnabled = checked && enabledCount === 1
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors ${
                      isLastEnabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:bg-accent/60'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isLastEnabled}
                      onCheckedChange={() => toggleChallenge(c.id)}
                      aria-label={`Desafio ${c.title}`}
                    />
                    <span aria-hidden="true">{c.emoji}</span>
                    <span className="text-sm leading-tight">{c.title}</span>
                  </label>
                )
              })}
            </div>
            {disabledCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={enableAllChallenges}
              >
                Ativar todos
              </Button>
            )}
          </div>

          {/* Som */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.sound ? (
                  <Volume2 className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Som</Label>
                  <p className="text-xs text-muted-foreground">
                    Alarme quando o ciclo terminar
                  </p>
                </div>
              </div>
              <Switch
                id="sound"
                checked={settings.sound}
                onCheckedChange={(checked) => onChange({ sound: checked })}
              />
            </div>

            {settings.sound && (
              <div className="space-y-2 border-t pt-3">
                <Label htmlFor="alarm-sound">Som do alarme</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.alarmSound}
                    onValueChange={(value) => {
                      onChange({ alarmSound: value as AlarmSoundId })
                      // toca na hora para a pessoa ouvir como ficou
                      primeAudio()
                      previewAlarm(value as AlarmSoundId)
                    }}
                  >
                    <SelectTrigger id="alarm-sound" className="w-full">
                      <SelectValue placeholder="Escolha o som" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALARM_SOUNDS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.emoji} {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Ouvir prévia do som do alarme"
                    onClick={() => {
                      primeAudio()
                      previewAlarm(settings.alarmSound)
                    }}
                  >
                    <Play className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Toque no ▶ para ouvir a prévia. Qualquer clique ou tecla
                  interrompe o alarme na hora.
                </p>

                <Label htmlFor="alarm-duration">Duração do alarme</Label>
                <Select
                  value={String(settings.alarmDuration)}
                  onValueChange={(value) =>
                    onChange({
                      alarmDuration:
                        value === 'until-off'
                          ? 'until-off'
                          : (Number(value) as AlarmDuration),
                    })
                  }
                >
                  <SelectTrigger id="alarm-duration" className="w-full">
                    <SelectValue placeholder="Escolha a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALARM_DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {settings.alarmDuration === 'until-off'
                    ? 'O alarme repete sem parar até você clicar em qualquer lugar da página.'
                    : 'O alarme repete pelo tempo escolhido — e um clique interrompe antes, se você quiser.'}
                </p>
              </div>
            )}
          </div>

          {/* Notificações */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {settings.notifications ? (
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              ) : (
                <BellOff className="h-4 w-4" aria-hidden="true" />
              )}
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notificações</Label>
                <p className="text-xs text-muted-foreground">
                  Avisar pelo sistema mesmo em outra aba
                </p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
          {permission === 'denied' && (
            <p className="-mt-4 text-xs text-destructive">
              As notificações estão bloqueadas nas permissões do navegador.
              Libere o acesso nas configurações do site.
            </p>
          )}

          {/* Testar */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                primeAudio()
                onTestAlert()
                setOpen(false) // fecha o painel para o aviso ficar visível
              }}
            >
              <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
              Testar aviso agora
            </Button>
            <p className="text-xs text-muted-foreground">
              Quer ver como fica? Dispara um aviso de exemplo imediatamente.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
