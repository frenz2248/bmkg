<script setup lang="ts">
import { ref, computed } from 'vue';
import regionsDataRaw from '@/data/wilayah.json';
import { getWeatherByLocation, type WeatherResponse, type CuacaItem } from '@/services/weatherService';

// --- Interfaces ---
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

// State untuk menyimpan nama desa yang sedang ditampilkan
const currentDisplayVillageName = ref<string>("");

// --- Computed ---
const currentRegion = computed(() => regions.find(r => r.id === selectedRegionId.value) || null);
const currentDistrict = computed(() => currentRegion.value?.districts.find(d => d.id === selectedDistrictId.value) || null);

// --- Helper: Format Jam ---
const formatJam = (datetime: string) => {
  if (!datetime) return '-';
  const parts = datetime.split(' ');
  return parts[1]?.slice(0, 5) || datetime;
};

// --- LOGIKA FETCH DATA ---
const fetchWeatherById = async (adm4Code: string, villageName: string) => {
  if (!adm4Code) return;

  isLoading.value = true;
  weatherData.value = null;
  forecastList.value = [];
  currentDisplayVillageName.value = villageName;

  try {
    const response = await getWeatherByLocation(adm4Code);
    weatherData.value = response;

    if (response.data && response.data[0] && response.data[0].cuaca) {
      // Ratakan array cuaca (flat)
      response.data[0].cuaca.forEach((dailyWeather) => {
        dailyWeather.forEach((hourly) => {
          forecastList.value.push(hourly);
        });
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// --- LOGIKA OTOMATIS (Ambil Data Paling Atas) ---

// 1. Ganti Kabupaten -> Ambil Kecamatan Pertama -> Desa Pertama
const onRegionChange = () => {
  selectedDistrictId.value = "";
  selectedVillageId.value = "";

  const firstDistrict = currentRegion.value?.districts[0];
  const firstVillage = firstDistrict?.villages[0];

  if (firstVillage) {
    fetchWeatherById(firstVillage.id, firstVillage.name);
  }
};

// 2. Ganti Kecamatan -> Ambil Desa Pertama
const onDistrictChange = () => {
  selectedVillageId.value = "";

  const firstVillage = currentDistrict.value?.villages[0];

  if (firstVillage) {
    fetchWeatherById(firstVillage.id, firstVillage.name);
  }
};

// 3. Ganti Desa (Manual) -> Ambil Desa Terpilih
const onVillageChange = () => {
  const village = currentDistrict.value?.villages.find(v => v.id === selectedVillageId.value);
  if (village) {
    fetchWeatherById(village.id, village.name);
  }
};
</script>

<template>
  <div class="location-selector">
    <div class="card">
      <h2>Pilih Wilayah BMKG</h2>

      <div class="form-group">
        <label>Kabupaten / Kota:</label>
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
        <label>Desa / Kelurahan:</label>
        <select v-model="selectedVillageId" :disabled="!selectedDistrictId" @change="onVillageChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="v in currentDistrict?.villages" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Sedang memuat data cuaca...</p>
    </div>

    <div v-if="weatherData && !isLoading" class="result-container">
      <div class="location-info">
        <h3>📍 {{ weatherData.lokasi?.kecamatan || '...' }}</h3>
        <p>{{ weatherData.lokasi?.kotkab || '...' }} - {{ weatherData.lokasi?.provinsi || '...' }}</p>

        <div class="badge-info">
          Data diambil dari desa: <strong>{{ currentDisplayVillageName }}</strong>
        </div>
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

.loading-state { text-align: center; margin-top: 20px; color: #64748b; font-style: italic; }

.result-container { margin-top: 24px; animation: fadeIn 0.5s ease; }
.location-info { text-align: center; margin-bottom: 20px; color: #1e293b; }
.badge-info {
  display: inline-block; margin-top: 8px; padding: 4px 12px;
  background: #e0f2fe; color: #0369a1; border-radius: 20px; font-size: 0.85rem;
}

.weather-scroller { display: flex; overflow-x: auto; gap: 12px; padding-bottom: 12px; scroll-behavior: smooth; }
/* Scrollbar halus (opsional) */
.weather-scroller::-webkit-scrollbar { height: 6px; }
.weather-scroller::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

.weather-card {
  min-width: 130px; background: white; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.jam { font-size: 1.2rem; font-weight: bold; color: #1e293b; }
.tanggal { font-size: 0.8rem; color: #64748b; margin-bottom: 8px; }
.weather-icon { width: 50px; height: 50px; object-fit: contain; margin: 5px 0; }
.suhu { font-size: 1.5rem; font-weight: 700; color: #2563eb; }
.desc { font-size: 0.9rem; margin-bottom: 10px; color: #475569; min-height: 40px; display: flex; align-items: center; justify-content: center;}
.detail { font-size: 0.8rem; color: #64748b; display: flex; justify-content: space-around; width: 100%; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
