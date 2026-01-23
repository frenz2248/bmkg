<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { getGempaTerbaru, type DataGempa } from '@/services/gempaService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Wajib import CSS peta

const gempa = ref<DataGempa | null>(null);
const isLoading = ref(true);

// Fungsi Helper: Ubah string koordinat BMKG ke angka (Latitude/Longitude)
// Contoh: "5.21 LS" -> -5.21, "110 BT" -> 110
const parseCoord = (str: string, type: 'lat' | 'lon'): number => {
  if (!str) return 0;
  const val = parseFloat(str.replace(',', '.')); // Ganti koma jadi titik kalau ada

  if (type === 'lat' && str.toUpperCase().includes('LS')) return -Math.abs(val); // Lintang Selatan = Negatif
  if (type === 'lon' && str.toUpperCase().includes('BB')) return -Math.abs(val); // Bujur Barat = Negatif

  return val; // Default (LU atau BT) positif
};

const initMap = () => {
  if (!gempa.value) return;

  // 1. Ambil koordinat
  const lat = parseCoord(gempa.value.Lintang, 'lat');
  const lon = parseCoord(gempa.value.Bujur, 'lon');

  // 2. Inisialisasi Peta
  // 'map-gempa' adalah ID dari div di template
  const map = L.map('map-gempa').setView([lat, lon], 6); // Zoom level 6

  // 3. Tambahkan Layer Peta (Pakai OpenStreetMap yang gratis)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  // 4. Tambahkan Marker Lingkaran Merah (Episenter)
  const circle = L.circleMarker([lat, lon], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 20 // Ukuran lingkaran
  }).addTo(map);

  // 5. Tambahkan Popup Keren
  const popupContent = `
    <div style="text-align: center;">
      <h3 style="margin: 0; color: #d32f2f;">${gempa.value.Magnitude} SR</h3>
      <p style="margin: 5px 0;">${gempa.value.Tanggal} - ${gempa.value.Jam}</p>
      <b>${gempa.value.Wilayah}</b><br>
      <small>Kedalaman: ${gempa.value.Kedalaman}</small>
    </div>
  `;

  circle.bindPopup(popupContent).openPopup();
};

onMounted(async () => {
  gempa.value = await getGempaTerbaru();
  isLoading.value = false;

  // Tunggu sampai HTML selesai dirender Vue, baru gambar petanya
  if (gempa.value) {
    nextTick(() => {
      initMap();
    });
  }
});
</script>

<template>
  <div class="gempa-card">
    <div class="header-section">
      <h2>🌋 Gempabumi Terkini</h2>
      <span v-if="gempa" class="live-badge">Real-time</span>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div> Memuat data gempa...
    </div>

    <div v-else-if="gempa" class="content">

      <div id="map-gempa" class="map-container"></div>

      <div class="info-panel">
        <div class="main-stats">
          <div class="stat-item magnitude">
            <span class="value">{{ gempa.Magnitude }}</span>
            <span class="label">Magnitudo</span>
          </div>
          <div class="stat-item depth">
            <span class="value">{{ gempa.Kedalaman }}</span>
            <span class="label">Kedalaman</span>
          </div>
        </div>

        <div class="detail-text">
          <p class="time">🕒 {{ gempa.Jam }} WIB, {{ gempa.Tanggal }}</p>
          <p class="loc">📍 {{ gempa.Wilayah }}</p>
          <p class="potency" :class="{ 'danger': gempa.Potensi.includes('TSUNAMI') }">
            📢 {{ gempa.Potensi }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="error">Data gempa tidak tersedia.</div>
  </div>
</template>

<style scoped>
/* Container Widget */
.gempa-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  /* Biar peta ga keluar dari border radius */
  font-family: 'Segoe UI', sans-serif;
  max-width: 600px;
  margin: 30px auto;
  border: 1px solid #e2e8f0;
}

.header-section {
  padding: 15px 20px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

h2 {
  margin: 0;
  color: #1e293b;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-badge {
  background: #fee2e2;
  color: #991b1b;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: bold;
  animation: pulse 2s infinite;
}

/* MAP STYLE - PENTING! */
.map-container {
  width: 100%;
  height: 300px;
  /* Tinggi peta harus ditentukan! */
  background: #e2e8f0;
  z-index: 1;
  /* Pastikan di bawah navbar/dropdown */
}

/* Info Panel di Bawah Peta */
.info-panel {
  padding: 20px;
}

.main-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  padding: 15px;
  border-radius: 12px;
  text-align: center;
}

.stat-item.magnitude {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.stat-item.depth {
  background: #f0f9ff;
  color: #0ea5e9;
  border: 1px solid #bae6fd;
}

.stat-item .value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
}

.stat-item .label {
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.8;
}

.detail-text p {
  margin: 8px 0;
  color: #475569;
  font-size: 0.95rem;
}

.detail-text .loc {
  font-weight: 600;
  color: #1e293b;
}

.detail-text .potency {
  background: #ecfccb;
  color: #3f6212;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  margin-top: 15px;
}

.detail-text .potency.danger {
  background: #fee2e2;
  color: #991b1b;
}

.loading,
.error {
  padding: 40px;
  text-align: center;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #cbd5e1;
  border-top-color: #ef4444;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }

  100% {
    opacity: 1;
  }
}
</style>
