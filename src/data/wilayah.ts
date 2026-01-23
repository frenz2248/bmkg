// Import file-file json terpisah
import kediri from './kabupaten/kediri.json';
import blitar from './kabupaten/blitar.json';
import trenggalek from './kabupaten/trenggalek.json';
import kotaKediri from './kota/kotaKediri.json';
import kotaBlitar from './kota/kotaBlitar.json';

// Gabungkan jadi satu array
const regionsDataRaw = [
  kediri,
  blitar,
  trenggalek,
  kotaKediri,
  kotaBlitar,
  // Tambahkan kabupaten lain di sini nanti
];

export default regionsDataRaw;
