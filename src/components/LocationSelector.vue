<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import regionsDataRaw from '@/data/wilayah';
import { getWeatherByLocation, type WeatherResponse, type CuacaItem } from '@/services/weatherService';

// --- Interfaces ---
interface Village { id: string; name: string; }
interface District { id: string; name: string; villages: Village[]; }
interface Region { id: string; name: string; type: string; districts: District[]; }

// Interface untuk Index Pencarian
interface SearchIndexItem {
  label: string;
  regionId: string;
  districtId: string;
  villageId: string;
  villageName: string;
}

// --- State ---
const regions = regionsDataRaw as Region[];
const selectedRegionId = ref<string>("");
const selectedDistrictId = ref<string>("");
const selectedVillageId = ref<string>("");

const weatherData = ref<WeatherResponse | null>(null);
const forecastList = ref<CuacaItem[]>([]);
const isLoading = ref(false);
const currentDisplayVillageName = ref<string>("");
const statusMessage = ref<string>("");

// --- State Pencarian ---
const searchQuery = ref("");
const showSearchResults = ref(false);
const searchIndex = ref<SearchIndexItem[]>([]); // Menyimpan daftar semua desa yang diratakan

// --- Computed Helpers ---
const currentRegion = computed(() => regions.find(r => r.id === selectedRegionId.value) || null);
const currentDistrict = computed(() => currentRegion.value?.districts?.find(d => d.id === selectedDistrictId.value) || null);
const currentVillagesList = computed(() => currentDistrict.value?.villages || []);

// Filter Pencarian (Hanya jalan jika user ketik minimal 2 huruf)
const filteredSearchResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return [];

  const query = searchQuery.value.toLowerCase();
  // Filter dan ambil maksimal 10 hasil agar tidak berat
  return searchIndex.value
    .filter(item => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});

// --- Lifecycle: Bangun Index Pencarian saat Aplikasi Mulai ---
onMounted(() => {
  // Kita "ratakan" data yang bersarang (Nested) menjadi satu daftar panjang
  // Agar mudah dicari
  const tempIndex: SearchIndexItem[] = [];

  regions.forEach(region => {
    if (region.districts) {
      region.districts.forEach(district => {
        if (district.villages) {
          district.villages.forEach(village => {
            tempIndex.push({
              label: `${village.name}, ${district.name}, ${region.name}`, // Format tampilan
              regionId: region.id,
              districtId: district.id,
              villageId: village.id,
              villageName: village.name
            });
          });
        }
      });
    }
  });

  searchIndex.value = tempIndex;
});

// --- Helper: Format Jam ---
const formatJam = (datetime: string) => {
  if (!datetime) return '-';
  const parts = datetime.split(' ');
  return parts[1]?.slice(0, 5) || datetime;
};

// --- LOGIKA FETCH ---
const fetchWeatherById = async (adm4Code: string, villageName: string) => {
  isLoading.value = true;
  weatherData.value = null;
  forecastList.value = [];
  currentDisplayVillageName.value = villageName;
  statusMessage.value = "";

  try {
    const response = await getWeatherByLocation(adm4Code);
    if (response && response.data && response.data[0] && response.data[0].cuaca) {
      weatherData.value = response;
      response.data[0].cuaca.forEach(daily => daily.forEach(hourly => forecastList.value.push(hourly)));
    } else {
      statusMessage.value = "Data cuaca kosong dari BMKG.";
    }
  } catch {
    statusMessage.value = "Gagal mengambil data cuaca (404/Error).";
  } finally {
    isLoading.value = false;
  }
};

// --- LOGIKA PENCARIAN ---
const selectSearchResult = (item: SearchIndexItem) => {
  // 1. Set dropdown agar sesuai dengan lokasi yang dipilih
  selectedRegionId.value = item.regionId;

  setTimeout(() => {
    selectedDistrictId.value = item.districtId;
    selectedVillageId.value = item.villageId;

    // 2. Isi kotak pencarian dengan nama yang dipilih
    searchQuery.value = item.villageName;
    showSearchResults.value = false; // Tutup dropdown hasil

    // 3. Langsung cari cuaca
    fetchWeatherById(item.villageId, item.villageName);
  }, 50);
};

// Tutup hasil pencarian jika klik di luar (opsional, sederhana saja dulu)
const onSearchBlur = () => {
  // Beri delay biar klik di item sempat terproses
  setTimeout(() => { showSearchResults.value = false; }, 200);
};

// --- EVENTS DROPDOWN (Manual) ---
const onRegionChange = () => {
  selectedDistrictId.value = "";
  selectedVillageId.value = "";
  // Auto-select logic yang lama dihapus biar tidak bentrok dengan pencarian manual
};

const onDistrictChange = () => {
  selectedVillageId.value = "";
};

const onVillageChange = () => {
  const v = currentVillagesList.value.find(v => v.id === selectedVillageId.value);
  if (v) fetchWeatherById(v.id, v.name);
};
</script>

<template>
  <div class="location-selector">
    <div class="card">
      <h2>Pilih Wilayah BMKG</h2>

      <div class="search-container">
        <label>🔍 Pencarian Cepat:</label>
        <div class="search-wrapper">
          <input type="text" v-model="searchQuery" placeholder="Ketik nama desa atau kecamatan..." class="search-input"
            @focus="showSearchResults = true" @blur="onSearchBlur" />

          <ul v-if="showSearchResults && filteredSearchResults.length > 0" class="search-results">
            <li v-for="(result, idx) in filteredSearchResults" :key="idx" @click="selectSearchResult(result)">
              {{ result.label }}
            </li>
          </ul>
          <div v-if="showSearchResults && searchQuery.length > 2 && filteredSearchResults.length === 0"
            class="no-result">
            Tidak ditemukan desa dengan nama tersebut.
          </div>
        </div>
      </div>

      <div class="divider"><span>ATAU PILIH MANUAL</span></div>

      <div class="form-group">
        <label>Kabupaten / Kota:</label>
        <select v-model="selectedRegionId" @change="onRegionChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Kecamatan:</label>
        <select v-model="selectedDistrictId" :disabled="!selectedRegionId" @change="onDistrictChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="d in currentRegion?.districts" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Desa / Kelurahan:</label>
        <select v-model="selectedVillageId" :disabled="!selectedDistrictId" @change="onVillageChange">
          <option disabled value="">-- Pilih --</option>
          <option v-for="v in currentVillagesList" :key="v.id" :value="v.id">{{ v.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading || statusMessage" class="status-box">
      <div v-if="isLoading" class="spinner"></div>
      <p>{{ statusMessage || 'Memuat data...' }}</p>
    </div>

    <div v-if="weatherData && !isLoading" class="result-container">
      <div class="location-info">
        <h3>📍 {{ weatherData.lokasi?.kecamatan }}</h3>
        <p>{{ weatherData.lokasi?.kotkab }}</p>
        <div class="badge-info">Data Desa: {{ currentDisplayVillageName }}</div>
      </div>

      <div class="weather-scroller">
        <div v-for="(cuaca, index) in forecastList" :key="index" class="weather-card">
          <div class="jam">{{ formatJam(cuaca.local_datetime) }}</div>
          <img :src="cuaca.image" alt="icon" class="weather-icon" />
          <div class="suhu">{{ cuaca.t }}°C</div>
          <div class="desc">{{ cuaca.weather_desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-selector {
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Segoe UI', sans-serif;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* STYLE PENCARIAN BARU */
.search-container {
  margin-bottom: 20px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 94%;
  padding: 12px 15px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  outline: none;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.search-results li {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.95rem;
}

.search-results li:hover {
  background-color: #f0f9ff;
  color: #0284c7;
}

.no-result {
  position: absolute;
  top: 100%;
  background: white;
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #ef4444;
  z-index: 100;
  margin-top: 5px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  border-bottom: 1px solid #e2e8f0;
  line-height: 0.1em;
}

.divider span {
  background: #fff;
  padding: 0 10px;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Style Dropdown Manual & Lainnya (Tetap Sama) */
.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #475569;
}

select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
}

.status-box {
  margin-top: 20px;
  text-align: center;
  color: #64748b;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.result-container {
  margin-top: 24px;
  animation: fadeIn 0.5s ease;
}

.location-info {
  text-align: center;
  margin-bottom: 20px;
}

.badge-info {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background: #dcfce7;
  color: #166534;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.weather-scroller {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 12px;
}

.weather-card {
  min-width: 100px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.weather-icon {
  width: 40px;
  height: 40px;
  margin: 5px auto;
  display: block;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #cbd5e1;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
