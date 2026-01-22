<script setup lang="ts">
import { ref, computed } from 'vue';
import regionsDataRaw from '@/data/wilayah.json';
import { getWeatherByLocation, type WeatherResponse, type CuacaItem } from '@/services/weatherService';

// --- Interfaces Wilayah ---
interface Village { id: string; name: string; }
interface District { id: string; name: string; villages: Village[]; }
interface Region { id: string; name: string; type: string; districts: District[]; }

// --- State ---
const regions = regionsDataRaw as Region[];
const selectedRegionId = ref<string>("");
const selectedDistrictId = ref<string>("");
const selectedVillageId = ref<string>("");

const weatherData = ref<WeatherResponse | null>(null);
const forecastList = ref<CuacaItem[]>([]);
const isLoading = ref(false);

// --- Computed ---
// Cari Region berdasarkan ID
const currentRegion = computed(() => {
  return regions.find(r => r.id === selectedRegionId.value) || null;
});

// Cari District berdasarkan ID
const currentDistrict = computed(() => {
  return currentRegion.value?.districts.find(d => d.id === selectedDistrictId.value) || null;
});


// --- Helper: Format Jam ---
const formatJam = (datetime: string) => {
  if (!datetime) return '-';
  const parts = datetime.split(' ');
  return parts[1]?.slice(0, 5) || datetime;
};

// --- Reset Logic ---
const onRegionChange = () => { selectedDistrictId.value = ""; selectedVillageId.value = ""; weatherData.value = null; };
const onDistrictChange = () => { selectedVillageId.value = ""; weatherData.value = null; };

// --- Fetch API ---
const cekCuaca = async () => {
  if (!selectedVillageId.value) return;

  isLoading.value = true;
  weatherData.value = null;
  forecastList.value = [];

  try {
    const response = await getWeatherByLocation(selectedVillageId.value);
    weatherData.value = response;

    if (response.data && response.data[0] && response.data[0].cuaca) {
      response.data[0].cuaca.forEach((dailyWeather) => {
        dailyWeather.forEach((hourly) => {
          forecastList.value.push(hourly);
        });
      });
    }
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    alert("Gagal mengambil data. Pastikan server proxy aktif.");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="location-selector">
    <div class="card">
      <h2>Pilih Wilayah BMKG</h2>

      <div class="form-group">
        <label>Kabupaten:</label>
        <select v-model="selectedRegionId" @change="onRegionChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Kecamatan:</label>
        <select v-model="selectedDistrictId" :disabled="!currentRegion" @change="onDistrictChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="d in currentRegion?.districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Desa:</label>
        <select v-model="selectedVillageId" :disabled="!selectedDistrictId">
          <option disabled value="">-- Pilih --</option>
          <option v-for="v in currentDistrict?.villages" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </div>

      <button @click="cekCuaca" :disabled="!selectedVillageId || isLoading" class="btn-action">
        {{ isLoading ? 'Memuat...' : 'Cek Cuaca' }}
      </button>
    </div>

    <div v-if="weatherData" class="result-container">
      <div class="location-info">
        <h3>📍 {{ weatherData.lokasi?.desa || '-' }}, {{ weatherData.lokasi?.kecamatan || '-' }}</h3>
        <p>{{ weatherData.lokasi?.kotkab || '-' }} - {{ weatherData.lokasi?.provinsi || '-' }}</p>
      </div>

      <div class="weather-scroller">
        <div v-for="(cuaca, index) in forecastList" :key="index" class="weather-card">
          <div class="jam">{{ formatJam(cuaca.local_datetime) }}</div>

          <div class="tanggal">{{ cuaca.local_datetime.split(' ')[0] }}</div>

          <img :src="cuaca.image" alt="icon" class="weather-icon" />

          <div class="suhu">{{ cuaca.t }}°C</div>
          <div class="desc">{{ cuaca.weather_desc }}</div>

          <div class="detail">
            <span>💧 {{ cuaca.hu }}%</span>
            <span>💨 {{ cuaca.ws }} km/j</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-selector { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', sans-serif; }
.card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 600; color: #475569; }
select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 1rem; }
.btn-action { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 10px;}
.btn-action:disabled { background: #94a3b8; cursor: not-allowed; }

.result-container { margin-top: 24px; }
.location-info { text-align: center; margin-bottom: 20px; color: #1e293b; }
.weather-scroller { display: flex; overflow-x: auto; gap: 12px; padding-bottom: 12px; scroll-behavior: smooth; }
.weather-card {
  min-width: 130px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.jam { font-size: 1.2rem; font-weight: bold; color: #1e293b; }
.tanggal { font-size: 0.8rem; color: #64748b; margin-bottom: 8px; }
.weather-icon { width: 50px; height: 50px; object-fit: contain; margin: 5px 0; }
.suhu { font-size: 1.5rem; font-weight: 700; color: #2563eb; }
.desc { font-size: 0.9rem; margin-bottom: 10px; color: #475569; min-height: 40px; display: flex; align-items: center; justify-content: center;}
.detail { font-size: 0.8rem; color: #64748b; display: flex; justify-content: space-around; width: 100%; }
</style>
