import axios from 'axios'

const API_BASE_URL = '/api-bmkg/publik/prakiraan-cuaca'

// --- Interfaces ---

export interface Lokasi {
  adm4: string
  desa: string
  kecamatan: string
  kotkab: string
  provinsi: string
  timezone?: string
}

export interface CuacaItem {
  local_datetime: string
  t: number
  hu: number
  weather_desc: string
  ws: number
  wd: string
  image: string
}

export interface WeatherResponse {
  lokasi: Lokasi
  data: Array<{
    lokasi: Lokasi
    cuaca: Array<Array<CuacaItem>>
  }>
}

// --- Fungsi Fetch ---
export const getWeatherByLocation = async (kodeWilayah: string) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: {
        adm4: kodeWilayah,
      },
    })
    return response.data as WeatherResponse
  } catch (error) {
    console.error('Gagal mengambil data BMKG:', error)
    throw error
  }
}
