---
name: 3d-web-experience
description: Build, audit, or improve purposeful interactive Three.js scenes inside React components, React artifacts, or standalone HTML pages. Use when the user asks for 3D web experiences, Three.js scenes, product viewers, procedural 3D objects, particle fields, scroll-driven camera scenes, shader glow effects, or interactive depth/motion in frontend work. Three.js r128 is the target; use Three.js directly, not React Three Fiber.
---

# 3D Web Experience

Build purposeful interactive Three.js scenes inside React components or HTML pages. Three.js r128 is the available baseline. Use it directly; do not use React Three Fiber.

## When 3D Is Right

Use 3D only when depth or motion is central to the experience:

- Good: product viewer, rotate/zoom/inspect flow, spatial walkthrough, interactive data visualization, signature landing-page wow moment, particle or geometry art where motion is the message.
- Bad: generic blog hero, decorative background, slow marketing page visual, every section of a long page, mobile-first app flourish.

Rule of thumb: if a photo, illustration, CSS gradient, or 2D animation communicates the same thing, skip 3D.

## Imports And Version Limits

For React/artifacts:

```jsx
import * as THREE from 'three';
```

For standalone HTML use:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

Available in r128: core geometries, core materials, lights, textures, fog, raycaster, clock, vectors, colors, groups, BufferGeometry, BufferAttribute, ShaderMaterial, and RawShaderMaterial.

Do not use:

- `CapsuleGeometry`; build a capsule from `CylinderGeometry` plus sphere caps.
- `THREE.OrbitControls`; implement pointer/touch controls manually.
- `GLTFLoader`, `DRACOLoader`, postprocessing, `EffectComposer`, or `three/examples/jsm/*`.

## Required Scene Baseline

Every scene should include:

- `Scene`, `PerspectiveCamera`, `WebGLRenderer({ antialias: true, alpha: true })`.
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`, lowered to 1 on mobile when useful.
- Ambient plus directional/point/hemisphere lighting unless intentionally flat.
- A resize handler that updates camera aspect/projection and renderer size.
- A cleanup path that cancels animation, removes listeners, disposes geometries/materials/textures, and calls `renderer.dispose()`.
- Pointer events for mouse and touch; never mouse-only interactions.
- Colors pulled from the active design system/CSS variables, not hardcoded unless no palette exists.

## Manual Orbit Pattern

Use pointer events around a target group:

```js
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };

canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  previousMouse = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - previousMouse.x;
  const dy = e.clientY - previousMouse.y;
  rotation.y += dx * 0.005;
  rotation.x += dy * 0.005;
  rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotation.x));
  previousMouse = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('pointerup', () => {
  isDragging = false;
});

// In animation:
targetGroup.rotation.x = rotation.x;
targetGroup.rotation.y = rotation.y;
```

Also listen for `pointerleave`/`pointercancel` in production components.

## Scene Patterns

### Floating Geometry Hero

Use 4 to 12 lightweight primitives such as `IcosahedronGeometry`, `OctahedronGeometry`, `TorusGeometry`, or `TorusKnotGeometry`. Give each mesh `userData.speed` and `userData.axis`, then animate slow rotation and small vertical drift with `Clock`.

### Particle Field

Use `BufferGeometry` with `Float32Array` positions and colors, plus `PointsMaterial` with `vertexColors`. Use about 2000 particles on desktop and reduce by at least 50 percent on mobile. Animate very slow group rotation.

### Procedural Product Viewer

When no GLB is available, build the object from primitives in a `Group`. Use manual orbit controls on the product group. Keep the subject readable: one object, clean lighting, and stable camera framing.

### Scroll-Driven Camera

For HTML pages, map `window.scrollY / (document.body.scrollHeight - window.innerHeight)` across camera waypoints. Interpolate camera position and look-at target. Keep this to one section or a short story sequence.

### Glow Sphere Shader

Use `ShaderMaterial` with `uTime` and `uColor`, a normal-based fragment intensity, and `transparent: true`. Update `uTime` from `Clock` in the animation loop.

## React Implementation Rules

- Put Three.js code in a client component (`'use client'`) and initialize it in `useEffect`.
- Store DOM mount/canvas refs with `useRef`.
- Keep `requestAnimationFrame` id in a closure/ref and cancel it on unmount.
- Do not use `setAnimationLoop` unless cleanup reliably stops it.
- Avoid React state inside the animation loop; mutate Three.js objects directly.
- Keep the canvas as one element inside the page, not the whole app.

## Design Integration

- Scene background: transparent renderer over CSS, or match `--bg`.
- Primary geometry: `--accent`.
- Secondary geometry/particles: `--surface`, `--surface-alt`, or `--text-muted`.
- Lights: white or lightly tinted by the accent.
- 3D can replace a hero image or feature visual. Keep one focused subject, layer HTML text with `position: absolute` and `pointer-events: none`, and match lighting to the page mood.

Convert CSS/hex colors with `new THREE.Color('#FF4700')`.

## Performance And Mobile

- Keep total scene geometry under about 100k faces.
- Use max 1024 by 1024 textures for web.
- Use `Clock` delta/elapsed time, not frame count.
- Debounce or throttle resize work if the component is heavy.
- On mobile: halve particle counts, lower pixel ratio to 1, use fewer geometry segments, and consider replacing purely decorative 3D with CSS.
- If a frame takes over 16ms, simplify geometry, particle count, shader complexity, shadows, or pixel ratio.

## Verification

Before finishing 3D work, run or request visual verification:

- Desktop and mobile viewport screenshots.
- Canvas is nonblank and correctly framed.
- Resize does not distort the scene.
- Pointer/touch interaction works.
- No console errors.
- React unmount/remount does not leak canvases, animation loops, or WebGL contexts.

## Hard Don'ts

- Do not add 3D just for decoration.
- Do not use r128-missing APIs or `examples/jsm` imports.
- Do not skip resize and cleanup.
- Do not make a whole long page into one 3D scene.
- Do not hardcode palette colors when a design system exists.
- Do not assume mouse-only users.
