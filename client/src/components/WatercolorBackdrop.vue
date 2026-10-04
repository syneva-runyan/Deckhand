<template>
  <div class="wc">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <filter id="wc-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="60" result="d" />
          <feGaussianBlur in="d" stdDeviation="14" />
        </filter>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.12 0" />
        </filter>
      </defs>
    </svg>
    <div class="wc__wash" aria-hidden="true">
      <svg viewBox="0 0 1000 1600" preserveAspectRatio="none">
        <g filter="url(#wc-soft)" style="mix-blend-mode: multiply">
          <ellipse cx="120" cy="200" rx="380" ry="260" fill="#8cc4bc" opacity="0.6" />
          <ellipse cx="760" cy="150" rx="360" ry="220" fill="#f1c27d" opacity="0.6" />
          <ellipse cx="460" cy="470" rx="460" ry="200" fill="#ef9f8a" opacity="0.5" />
          <ellipse cx="900" cy="620" rx="300" ry="260" fill="#9db7d8" opacity="0.5" />
          <ellipse cx="150" cy="820" rx="360" ry="260" fill="#b7d2a5" opacity="0.45" />
          <ellipse cx="640" cy="1000" rx="440" ry="240" fill="#f1c27d" opacity="0.4" />
          <ellipse cx="200" cy="1300" rx="360" ry="260" fill="#9db7d8" opacity="0.45" />
          <ellipse cx="800" cy="1450" rx="360" ry="220" fill="#ef9f8a" opacity="0.4" />
        </g>
      </svg>
    </div>
    <svg class="wc__paper" aria-hidden="true"><rect width="100%" height="100%" filter="url(#paper)" /></svg>
  </div>
</template>

<style scoped>
.wc__wash { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.wc__wash svg { width: 100%; height: 100%; }
.wc__paper { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; mix-blend-mode: multiply; }
</style>
