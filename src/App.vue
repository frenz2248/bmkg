<script setup lang="ts">
import LocationSelector from '@/components/LocationSelector.vue';
</script>

<template>
  <main class="app-container">
    <header>
      <h1>🌤️ Cuaca BMKG Jawa Timur</h1>
      <p>Cek prakiraan cuaca berdasarkan wilayah desa kamu</p>
    </header>

    <LocationSelector />

  </main>
</template>

<style scoped>
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  text-align: center;
}

header {
  margin-bottom: 2rem;
}

h1 {
  color: #1e293b;
  margin-bottom: 0.5rem;
}

p {
  color: #64748b;
}
</style>
