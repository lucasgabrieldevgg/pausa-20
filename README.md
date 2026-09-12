# Pausa 20 👁️

**Lembrete periódico para descansar os olhos — regra 20-20-20 com desafios personalizados.**

> 🔗 **Teste agora: [https://pausa-20.vercel.app](https://pausa-20.vercel.app)**

Deixe a aba aberta e o Pausa 20 te avisa periodicamente para tirar os olhos da tela — ou te manda um desafio rápido para cumprir na hora.

## 💡 A regra 20-20-20

A cada **20 minutos** (ou menos), olhe para algo a pelo menos **20 pés** (~6 metros) de distância por **20 segundos** — no mínimo. Ficar muito tempo sem pausar cansa a vista e pode causar síndrome visual do computador (olhos secos, visão embaçada, dor de cabeça).

## ✨ Funcionalidades

- ⏱️ **Timer inteligente** — contagem por timestamp, continua precisa mesmo com a aba em segundo plano
- 🎯 **Modo desafio** — ao fim de cada ciclo, um desafio aleatório aparece com contagem de 20 segundos
- ✅ **Desafios personalizados** — marque/desmarque os 12 desafios para usar só o que você consegue fazer no seu ambiente (mínimo de 1 ativo)
- 🔔 **Avisos** — som sintetizado, notificação do navegador e título da aba com o tempo restante
- 🙁 **Só avisar** — prefere sem desafios? Um banner discreto aparece no canto
- 😴 **Soneca** — adie o próximo aviso em 5 minutos quando estiver no meio de algo importante
- 📊 **Progresso do dia** — contador de pausas concluídas
- 🌙 **Tema claro/escuro**
- 💾 **Sem cadastro, sem servidor** — tudo fica salvo no seu navegador (localStorage)

## 🧩 Os 12 desafios

Olhar 20 segundos para longe · Olhar pela janela · Fechar os olhos · Piscar devagar · Alongar o pescoço · Levantar e caminhar · Beber água · Alongar os braços · Achar 3 objetos distantes · Olhar algo natural · Buscar luz natural · Sacudir o corpo

## 🛠️ Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- framer-motion · next-themes · lucide-react
- Web Audio API (sons sintetizados, zero arquivos externos)
- Notifications API

## 🚀 Rodando localmente

```bash
bun install
bun run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## ☁️ Deploy

Hospedado na [Vercel](https://vercel.com) → **https://pausa-20.vercel.app**
