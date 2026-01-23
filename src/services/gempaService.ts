import axios from 'axios';

// URL Proxy yang baru kita buat
const URL_GEMPA = '/gempa-bmkg/DataMKG/TEWS/autogempa.xml';

export interface DataGempa {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Magnitude: string;
  Kedalaman: string;
  Lintang: string;
  Bujur: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan: string;
  Shakemap: string;
}

export const getGempaTerbaru = async (): Promise<DataGempa | null> => {
  try {
    // 1. Ambil data sebagai TEXT (karena isinya XML)
    const response = await axios.get(URL_GEMPA, { responseType: 'text' });
    const xmlText = response.data;

    // 2. Parse XML menggunakan DOMParser (Bawaan Browser)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // 3. Ambil elemen <gempa>
    const gempaNode = xmlDoc.querySelector("Infogempa > gempa");

    if (!gempaNode) return null;

    // 4. Konversi Node XML ke Object JavaScript
    const getData = (tag: string) => gempaNode.querySelector(tag)?.textContent || "-";

    return {
      Tanggal: getData("Tanggal"),
      Jam: getData("Jam"),
      DateTime: getData("DateTime"),
      Magnitude: getData("Magnitude"),
      Kedalaman: getData("Kedalaman"),
      Lintang: getData("Lintang"),
      Bujur: getData("Bujur"),
      Wilayah: getData("Wilayah"),
      Potensi: getData("Potensi"),
      Dirasakan: getData("Dirasakan"),
      Shakemap: "https://data.bmkg.go.id/DataMKG/TEWS/" + getData("Shakemap")
    };

  } catch (error) {
    console.error("Gagal mengambil data gempa:", error);
    return null;
  }
};
