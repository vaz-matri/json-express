<script></script>
<template>
  <svg viewBox="0 0 360 340" width="480" height="453" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="h_r1"><rect x="40" y="20"  width="280" height="44"/></clipPath>
      <clipPath id="h_r2"><rect x="40" y="76"  width="280" height="44"/></clipPath>
      <clipPath id="h_r3"><rect x="40" y="132" width="280" height="44"/></clipPath>
      <clipPath id="h_r4"><rect x="40" y="188" width="280" height="44"/></clipPath>
      <clipPath id="h_r5"><rect x="40" y="244" width="280" height="44"/></clipPath>
    </defs>

    <!-- ROW 1 · teal → cream · wipe at 0s -->
    <g clip-path="url(#h_r1)">
      <rect class="r1a" x="40"  y="20" width="280" height="40" rx="10" fill="#2a9d8f"/>
      <rect class="r1b" x="328" y="20" width="0"   height="40" rx="10" fill="#e8dfc8"/>
    </g>

    <!-- ROW 3 · cream → teal · wipe at 2s -->
    <g clip-path="url(#h_r3)">
      <rect class="r3a" x="40"  y="132" width="280" height="40" rx="10" fill="#e8dfc8"/>
      <rect class="r3b" x="328" y="132" width="0"   height="40" rx="10" fill="#2a9d8f"/>
    </g>

    <!-- ROW 2 · teal → cream · wipe at 3.5s -->
    <g clip-path="url(#h_r2)">
      <rect class="r2a" x="40"  y="76" width="280" height="40" rx="10" fill="#2a9d8f"/>
      <rect class="r2b" x="328" y="76" width="0"   height="40" rx="10" fill="#e8dfc8"/>
    </g>

    <!-- ROW 4 · cream → teal · wipe at 5s -->
    <g clip-path="url(#h_r4)">
      <rect class="r4a" x="40"  y="188" width="280" height="40" rx="10" fill="#e8dfc8"/>
      <rect class="r4b" x="328" y="188" width="0"   height="40" rx="10" fill="#2a9d8f"/>
    </g>

    <!-- ROW 5 · teal → cream · wipe at 6.5s -->
    <g clip-path="url(#h_r5)">
      <rect class="r5a" x="40"  y="244" width="280" height="40" rx="10" fill="#2a9d8f"/>
      <rect class="r5b" x="328" y="244" width="0"   height="40" rx="10" fill="#e8dfc8"/>
    </g>

    <!-- BOTTOM BAR · static -->
    <rect x="40" y="300" width="280" height="18" rx="9" fill="#2a9d8f" opacity="0.15"/>
  </svg>
</template>

<style scoped>
/* Block A: shrinks width from 280 to 0 */
@keyframes shrink {
  from { width: 280px; }
  to   { width: 0px; }
}
/* Block B: grows from right, x 328→40, width 0→280 */
@keyframes grow-x {
  from { width: 0px;   x: 328px; }
  to   { width: 280px; x: 40px;  }
}

.r1a { animation: shrink 1.8s 0s   cubic-bezier(0.4,0,0.2,1) both; }
.r1b { animation: grow-x 1.8s 0s   cubic-bezier(0.4,0,0.2,1) both; }
.r3a { animation: shrink 1.8s 2s   cubic-bezier(0.4,0,0.2,1) both; }
.r3b { animation: grow-x 1.8s 2s   cubic-bezier(0.4,0,0.2,1) both; }
.r2a { animation: shrink 1.8s 3.5s cubic-bezier(0.4,0,0.2,1) both; }
.r2b { animation: grow-x 1.8s 3.5s cubic-bezier(0.4,0,0.2,1) both; }
.r4a { animation: shrink 1.8s 5s   cubic-bezier(0.4,0,0.2,1) both; }
.r4b { animation: grow-x 1.8s 5s   cubic-bezier(0.4,0,0.2,1) both; }
.r5a { animation: shrink 1.8s 6.5s cubic-bezier(0.4,0,0.2,1) both; }
.r5b { animation: grow-x 1.8s 6.5s cubic-bezier(0.4,0,0.2,1) both; }
</style>
