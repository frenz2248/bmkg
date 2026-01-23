// Import file-file json terpisah
import kediri from './kabupaten/kediri.json';

// Gabungkan jadi satu array
const regionsDataRaw = [
  kediri
  // Tambahkan kabupaten lain di sini nanti
];

// Export agar bisa dipakai di LocationSelector.vue
export default regionsDataRaw;
