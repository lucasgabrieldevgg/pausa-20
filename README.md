[🇧🇷 Português](README.pt-BR.md)

# Pausa 20 👁️

**A periodic reminder to rest your eyes — the 20-20-20 rule with personalized challenges.**

[![ci](https://github.com/lucasgabrieldevgg/pausa-20/actions/workflows/ci.yml/badge.svg)](https://github.com/lucasgabrieldevgg/pausa-20/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 🔗 **Try it now: [https://pausa-20.vercel.app](https://pausa-20.vercel.app)**

Leave the tab open and Pausa 20 reminds you, periodically, to take your eyes off the screen — or sends you a quick challenge to do on the spot.

## 💡 The 20-20-20 rule

Every **20 minutes** (or less), look at something at least **20 feet** (~6 meters) away for **20 seconds** — minimum. Going too long without breaks tires your eyes and can cause digital eye strain (dry eyes, blurry vision, headaches).

## ✨ Features

- ⏱️ **Smart timer** — timestamp-based counting, stays accurate even with the tab in the background
- 🎯 **Challenge mode** — at the end of each cycle, a random challenge appears with a 20-second countdown
- ✅ **Personalized challenges** — check/uncheck the 12 challenges to use only what you can do in your environment (minimum 1 active)
- 🔔 **An alarm you actually hear** — sound at the end of the cycle, repeating until you interact; choose from 4 alarms (classic, bell, chime and melody) and preview them in settings. On by default, and you can turn it off
- 🙁 **Just notify** — prefer no challenges? A discreet banner shows up in the corner
- 😴 **Snooze** — postpone the next reminder by 5 minutes when you're mid-something
- 📊 **Daily progress** — completed-break counter
- 🌙 **Light/dark theme**
- 💾 **No sign-up, no server** — everything is saved in your browser (localStorage)

## 🧩 The 12 challenges

Look away for 20 seconds · Look out the window · Close your eyes · Blink slowly · Stretch your neck · Stand up and walk · Drink water · Stretch your arms · Find 3 distant objects · Look at something natural · Get natural light · Shake it out

## 🛠️ Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- framer-motion · next-themes · lucide-react
- Web Audio API (synthesized sounds, zero external files)
- Notifications API

## 🚀 Running locally

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## ☁️ Deploy

Hosted on [Vercel](https://vercel.com) → **https://pausa-20.vercel.app**

## 🧪 Development

```
bun install && bunx prisma generate && bun run lint && bun run build
```

CI runs the full pipeline on every push (frozen lockfile → Prisma client → ESLint → the Next build as a real smoke test + secret hygiene).

## 🎨 Identity — RESPIRO

**Quicksand** (rounded and calm — the face of something telling you to rest) for the app, **JetBrains Mono** for the clock and tabular numbers. Zero template-default fonts (Geist/Inter).
