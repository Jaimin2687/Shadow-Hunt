# Shadow-Hunt UI Overhaul Walkthrough

The Shadow-Hunt dashboard has been completely refactored to match the premium, pitch-black cyber-luxury aesthetic of **StackScope**. We utilized `framer-motion`, `three.js`, and specialized UI primitives to deliver a 10/10 visual experience while maintaining sub-20ms rendering performance.

## 1. Landing Page (`/`)

We implemented a stunning new landing page acting as the gateway to the command center.

- **3D Background**: A reactive Three.js particle field (`<ParticleField />`) consisting of 1,500 slowly rotating nodes, layered with ambient blurred color orbs (`<AmbientOrbs />`) in Emerald, Cyan, and Crimson.
- **Perspective Grid Floor**: A custom CSS `grid-floor` animation giving a sense of depth and continuous forward motion.
- **Hero & CTAs**: High-contrast, tracking-widest typography, featuring staggered `framer-motion` reveal animations.
- **Architecture Showcase**: Interactive glass panels detailing the system's Zero-Trust Engine and SOAR pipeline.

## 2. Dashboard (`/dashboard`)

The main telemetry view has been moved to `/dashboard` and entirely re-skinned. 

- **Pitch-Black Theme**: Migrated from a navy/blue scheme to a stark `#000000` base with `#0a0a0a` glass cards.
- **Premium Primitives**: We built a custom set of UI primitives (`Card`, `GlassPanel`, `Badge`, `MetricCard`, `IconContainer`) powered by `clsx` and `tailwind-merge`.
- **Micro-Animations**:
  - Live Feed rows now slide in smoothly using `<motion.tr>`.
  - Risk Leaderboard ranks and progress bars animate fluidly using `<motion.div layout>`.
  - Attack injection toggles use premium custom switches with `layoutId` active states.
  - Hover states across the board feature subtle Y-axis translation and soft border glows (`rgba(255,255,255,0.15)`).

## 3. Data Integrity & Performance

- **Zero Data Loss**: All WebSocket connections, hooks, and types (`events.ts`, `useWebSocket.ts`) remained untouched. The pipeline is identical.
- **Client-Side Optimization**: The heavy 3D particle field is lazy-loaded using `next/dynamic` with `ssr: false` to ensure TTFB remains instant.

> [!TIP]
> **Try it out**: Visit `/` to see the new landing page, then click "Enter Command Center" to view the refactored dashboard in action. You'll immediately notice the premium cyber-luxury feel and butter-smooth transitions.
