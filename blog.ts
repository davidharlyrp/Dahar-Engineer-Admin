export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorTitle: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: "analisis-daya-dukung-pondasi",
    title: "Analisis Daya Dukung Pondasi: Metode Terzaghi vs Vesic",
    excerpt: "Perbandingan mendalam antara metode Terzaghi dan Vesic dalam menghitung daya dukung pondasi dangkal untuk berbagai kondisi tanah.",
    content: `# Analisis Daya Dukung Pondasi: Metode Terzaghi vs Vesic

Dalam dunia geoteknik, perhitungan daya dukung pondasi merupakan salah satu aspek fundamental yang menentukan keamanan dan stabilitas struktur bangunan. Dua metode yang paling umum digunakan adalah metode Terzaghi (1943) dan metode Vesic (1973), masing-masing memiliki keunggulan dan keterbatasan tersendiri.

## Metode Terzaghi (1943)

Metode Terzaghi merupakan pendekatan klasik yang telah terbukti reliabel selama puluhan tahun. Formula dasar Terzaghi untuk daya dukung ultimate adalah:

**qu = c·Nc + γ·D·Nq + 0.5·γ·B·Nγ**

Dimana:
- c = kohesi tanah
- γ = berat volume tanah
- D = kedalaman pondasi
- B = lebar pondasi
- Nc, Nq, Nγ = faktor daya dukung

### Keunggulan Metode Terzaghi:
1. Sederhana dan mudah dipahami - Formula yang relatif straightforward
2. Telah teruji waktu - Digunakan secara luas selama 80+ tahun
3. Konservatif - Memberikan hasil yang aman untuk kebanyakan kondisi

### Keterbatasan:
1. Tidak mempertimbangkan bentuk pondasi - Hanya untuk strip footing
2. Mengabaikan faktor kedalaman yang signifikan
3. Tidak cocok untuk pondasi dalam

## Metode Vesic (1973)

Vesic mengembangkan metode yang lebih komprehensif dengan mempertimbangkan berbagai faktor koreksi:

**qu = c·Nc·sc·dc·ic + γ·D·Nq·sq·dq·iq + 0.5·γ·B·Nγ·sγ·dγ·iγ**

Faktor koreksi meliputi:
- s = faktor bentuk (shape factor)
- d = faktor kedalaman (depth factor)  
- i = faktor kemiringan beban (inclination factor)

### Keunggulan Metode Vesic:
1. Lebih akurat - Mempertimbangkan geometri pondasi
2. Fleksibel - Dapat digunakan untuk berbagai bentuk pondasi
3. Komprehensif - Mencakup faktor-faktor yang diabaikan Terzaghi

### Keterbatasan:
1. Kompleks - Memerlukan perhitungan yang lebih detail
2. Membutuhkan data lengkap - Parameter tanah yang lebih banyak
3. Potensi over-design jika tidak hati-hati

## Studi Kasus Perbandingan

Untuk pondasi persegi 2m x 2m pada tanah lempung dengan:
- c = 25 kPa
- φ = 20°
- γ = 18 kN/m³
- D = 1.5 m

**Hasil Terzaghi**: qu = 180 kPa
**Hasil Vesic**: qu = 220 kPa

Perbedaan sekitar 22% menunjukkan pentingnya pemilihan metode yang tepat.

## Rekomendasi Praktis

1. Gunakan Terzaghi untuk:
   - Proyek sederhana dengan geometri standar
   - Tahap preliminary design
   - Kondisi tanah homogen

2. Gunakan Vesic untuk:
   - Proyek kompleks dengan beban miring
   - Pondasi dengan geometri khusus
   - Analisis detail dan optimasi

## Kesimpulan

Kedua metode memiliki tempatnya masing-masing dalam praktik geoteknik. Pemahaman yang mendalam tentang kondisi lapangan dan tujuan analisis akan menentukan metode mana yang paling sesuai untuk digunakan.

`,
    author: "David Harly Rizky Prabudhi, S.T.",
    authorTitle: "Geotechnical Engineer",
    publishDate: "2025-06-18",
    readTime: "8 menit",
    category: "Geoteknik",
    tags: ["Pondasi", "Daya Dukung", "Terzaghi", "Vesic", "Analisis Struktur"],
    featured: true
  },
  {
    id: "stabilitas-lereng-metode-bishop",
    title: "Analisis Stabilitas Lereng dengan Metode Bishop Simplified",
    excerpt: "Panduan praktis menggunakan metode Bishop untuk menganalisis stabilitas lereng dalam proyek geoteknik dengan berbagai kondisi tanah.",
    content: `# Analisis Stabilitas Lereng dengan Metode Bishop Simplified

Stabilitas lereng merupakan salah satu permasalahan kritis dalam geoteknik yang memerlukan analisis mendalam untuk mencegah longsor dan memastikan keamanan infrastruktur. Metode Bishop Simplified telah menjadi standar industri dalam analisis stabilitas lereng karena keseimbangan antara akurasi dan kemudahan implementasi.

## Konsep Dasar Metode Bishop

Metode Bishop Simplified dikembangkan oleh Alan W. Bishop pada tahun 1955 sebagai penyempurnaan dari metode irisan (method of slices). Metode ini mengasumsikan bahwa gaya antar-irisan hanya bekerja secara horizontal, sehingga menyederhanakan perhitungan tanpa mengorbankan akurasi secara signifikan.

### Formula Dasar

Faktor keamanan (FS) dihitung dengan persamaan:

**FS = Σ[c'·li + (Wi·cos αi - ui·li)·tan φ'] / mαi / Σ(Wi·sin αi)**

Dimana:
- c' = kohesi efektif
- φ' = sudut geser dalam efektif  
- Wi = berat irisan ke-i
- αi = sudut kemiringan dasar irisan
- ui = tekanan air pori
- li = panjang dasar irisan
- mαi = cos αi + (sin αi · tan φ')/FS

## Langkah-Langkah Analisis

### 1. Persiapan Model
- Geometri lereng: Tentukan profil lereng dan stratigrafi tanah
- Pembagian irisan: Bagi lereng menjadi 10-20 irisan vertikal
- Bidang longsor: Tentukan bidang longsor kritis (biasanya circular)

### 2. Input Parameter
- Parameter tanah: c', φ', γ untuk setiap lapisan
- Kondisi air tanah: Muka air tanah dan tekanan pori
- Beban eksternal: Jika ada struktur di atas lereng

### 3. Iterasi Perhitungan
Karena FS muncul di kedua sisi persamaan, diperlukan iterasi:
1. Asumsikan FS awal (biasanya 1.0)
2. Hitung FS baru dengan formula Bishop
3. Ulangi hingga konvergen (selisih < 0.001)

## Studi Kasus: Lereng Jalan Tol

Analisis stabilitas lereng setinggi 15 meter dengan kemiringan 1:1.5 pada proyek jalan tol:

### Data Tanah:
- Lapisan 1 (0-5m): Lempung, c'=15 kPa, φ'=18°, γ=17 kN/m³
- Lapisan 2 (5-15m): Lempung keras, c'=25 kPa, φ'=22°, γ=19 kN/m³
- Muka air tanah: 3 meter dari permukaan

### Hasil Analisis:
- Kondisi normal: FS = 1.85 (AMAN)
- Kondisi hujan: FS = 1.25 (AMAN dengan monitoring)
- Kondisi gempa: FS = 1.05 (KRITIS - perlu perkuatan)

## Faktor-Faktor yang Mempengaruhi Stabilitas

### 1. Geometri Lereng
- Tinggi lereng: Semakin tinggi, semakin tidak stabil
- Kemiringan: Lereng curam memiliki FS lebih rendah
- Bentuk bidang longsor: Circular vs non-circular

### 2. Kondisi Tanah
- Kohesi: Peningkatan c' meningkatkan stabilitas
- Sudut geser: φ' yang tinggi menguntungkan stabilitas
- Stratifikasi: Lapisan lemah dapat menjadi bidang longsor

### 3. Kondisi Air
- Tekanan pori: Mengurangi tegangan efektif
- Aliran air: Dapat menyebabkan erosi internal
- Fluktuasi muka air: Perubahan cepat berbahaya

## Metode Perkuatan Lereng

Jika FS < 1.3, diperlukan perkuatan:

### 1. Perkuatan Geometris
- Peelandaian: Mengurangi kemiringan lereng
- Berma: Membuat teras untuk mengurangi tinggi efektif
- Counterweight: Menambah beban di kaki lereng

### 2. Perkuatan Struktural
- Dinding penahan: Gravity wall atau cantilever wall
- Soil nailing: Untuk lereng eksisting
- Micropile: Untuk kondisi tanah keras

### 3. Perkuatan Geoteknis
- Drainase: Mengurangi tekanan air pori
- Soil improvement: Grouting atau deep mixing
- Geotextile: Untuk perkuatan tensile

## Validasi dan Monitoring

### Validasi Hasil:
1. Perbandingan metode: Cross-check dengan metode Fellenius
2. Analisis sensitivitas: Variasi parameter input
3. Kalibrasi: Dengan data kasus serupa

### Monitoring Lapangan:
1. Inclinometer: Mengukur pergerakan lateral
2. Piezometer: Monitoring tekanan air pori
3. Survey topografi: Deteksi pergerakan permukaan

## Kesimpulan dan Rekomendasi

Metode Bishop Simplified memberikan keseimbangan optimal antara akurasi dan efisiensi untuk analisis stabilitas lereng. Namun, keberhasilan analisis sangat bergantung pada:

1. Kualitas data tanah yang akurat dan representatif
2. Pemahaman kondisi hidrogeologi setempat
3. Pengalaman engineer dalam interpretasi hasil

Untuk proyek kritis, disarankan menggunakan analisis 2D atau 3D dengan software khusus dan melakukan back-analysis terhadap kasus longsor di area yang sama.

`,
    author: "David Harly Rizky Prabudhi, S.T.",
    authorTitle: "Geotechnical Engineer",
    publishDate: "2025-06-16",
    readTime: "12 menit",
    category: "Geoteknik",
    tags: ["Stabilitas Lereng", "Bishop Method", "Longsor", "Analisis Geoteknik", "Keamanan"],
    featured: false
  },
  {
    id: "karakteristik-tanah-ekspansif",
    title: "Karakteristik dan Penanganan Tanah Ekspansif di Indonesia",
    excerpt: "Memahami perilaku tanah ekspansif dan strategi mitigasi yang efektif untuk proyek konstruksi di daerah dengan tanah lempung montmorillonit.",
    content: `# Karakteristik dan Penanganan Tanah Ekspansif di Indonesia

Tanah ekspansif merupakan salah satu tantangan geoteknik yang sering dijumpai di Indonesia, terutama di daerah dengan iklim tropis yang memiliki musim kering dan hujan yang kontras. Tanah jenis ini dapat menyebabkan kerusakan signifikan pada struktur bangunan jika tidak ditangani dengan tepat.

## Definisi dan Mekanisme Tanah Ekspansif

Tanah ekspansif adalah tanah yang mengalami perubahan volume signifikan akibat perubahan kadar air. Tanah ini mengembang (swell) saat basah dan menyusut (shrink) saat kering. Mekanisme ini terjadi karena adanya mineral lempung montmorillonit yang memiliki struktur kristal berlapis dengan kemampuan menyerap air yang tinggi.

### Mineral Penyebab Ekspansif

1. Montmorillonit: Mineral utama penyebab ekspansif
   - Struktur 2:1 (dua lapisan silika, satu lapisan alumina)
   - Jarak antar lapisan dapat berubah drastis
   - Kapasitas tukar kation tinggi (80-120 meq/100g)

2. Vermikulit: Ekspansif sedang
   - Struktur mirip montmorillonit tapi lebih stabil
   - Kapasitas tukar kation 100-150 meq/100g

3. Smektit: Kelompok mineral ekspansif
   - Termasuk montmorillonit dan bentonit
   - Sangat sensitif terhadap perubahan kadar air

## Identifikasi Tanah Ekspansif

### Uji Laboratorium

### 1. Uji Indeks Plastisitas (PI)
- PI < 15: Ekspansif rendah
- PI 15-25: Ekspansif sedang  
- PI 25-35: Ekspansif tinggi
- PI > 35: Ekspansif sangat tinggi

### 2. Uji Free Swell Index (FSI)
- FSI < 50%: Ekspansif rendah
- FSI 50-100%: Ekspansif sedang
- FSI > 100%: Ekspansif tinggi

### 3. Uji Swell Pressure
Mengukur tekanan yang dihasilkan saat tanah mengembang:
- < 50 kPa: Ekspansif rendah
- 50-200 kPa: Ekspansif sedang
- > 200 kPa: Ekspansif tinggi

### Identifikasi Lapangan

### Indikator Visual:
1. Retakan poligonal pada permukaan tanah saat kering
2. Perubahan elevasi musiman pada struktur
3. Retakan pada dinding bangunan eksisting
4. Jalan bergelombang tanpa beban lalu lintas berat

### Uji Sederhana:
1. Jar Test: Mengamati pengembangan sampel dalam air
2. Thread Test: Menggulung tanah menjadi benang tipis
3. Shake Test: Mengamati reaksi terhadap getaran

## Distribusi Tanah Ekspansif di Indonesia

### Daerah Rawan:
1. Jawa Tengah: Semarang, Solo, Yogyakarta
2. Jawa Timur: Surabaya, Malang, Kediri  
3. Kalimantan: Pontianak, Banjarmasin
4. Sulawesi: Makassar, Palu
5. Nusa Tenggara: Kupang, Mataram

### Faktor Geologis:
- Formasi aluvial: Endapan sungai dan danau
- Batuan sedimen: Shale dan mudstone
- Aktivitas vulkanik: Abu vulkanik yang terlapukkan

## Dampak pada Struktur Bangunan

### Kerusakan Umum:

### 1. Pondasi
- Differential settlement: Penurunan tidak merata
- Heaving: Pengangkatan pondasi saat musim hujan
- Lateral pressure: Tekanan samping pada dinding basement

### 2. Struktur Atas
- Retakan dinding: Pola diagonal atau vertikal
- Pintu dan jendela macet: Akibat perubahan dimensi
- Retakan lantai: Terutama slab on grade

### 3. Infrastruktur
- Jalan bergelombang: Pumping dan rutting
- Utilitas rusak: Pipa air dan saluran pecah
- Drainase tersumbat: Akibat pergerakan tanah

## Strategi Penanganan

### 1. Modifikasi Tanah

### Stabilisasi Kimia:
- Kapur (Lime): 3-8% berat tanah
  - Mengurangi plastisitas
  - Meningkatkan kekuatan
  - Mengurangi potensi ekspansif

- Semen: 5-10% berat tanah
  - Sementasi partikel tanah
  - Meningkatkan kekuatan signifikan
  - Mengurangi permeabilitas

- Abu terbang: 10-20% berat tanah
  - Reaksi pozolanik dengan kapur
  - Ekonomis dan ramah lingkungan
  - Mengurangi ekspansif secara bertahap

### Stabilisasi Fisik:
- Preloading: Pembebanan awal untuk konsolidasi
- Compaction: Pemadatan optimal untuk mengurangi void
- Soil replacement: Penggantian dengan material non-ekspansif

### 2. Desain Struktural

### Pondasi:
- Pondasi dalam: Tiang pancang menembus lapisan ekspansif
- Pondasi terapung: Beam dan slab yang dapat bergerak
- Void forms: Ruang kosong di bawah slab untuk ekspansi

### Struktur:
- Flexible joints: Sambungan yang dapat mengakomodasi gerakan
- Reinforcement: Tulangan tambahan untuk menahan tensile stress
- Isolation: Memisahkan struktur dari tanah ekspansif

### 3. Manajemen Air

### Drainase:
- Surface drainage: Mencegah infiltrasi air hujan
- Subsurface drainage: French drain untuk kontrol muka air tanah
- Barrier: Geomembrane untuk isolasi kelembaban

### Irigasi Terkontrol:
- Maintaining moisture: Menjaga kadar air konstan
- Gradual wetting: Pembasahan bertahap sebelum konstruksi
- Monitoring: Sensor kelembaban untuk early warning

## Studi Kasus: Perumahan di Semarang

### Kondisi Awal:
- Jenis tanah: Lempung ekspansif dengan PI = 45%
- Kedalaman: 3-5 meter dari permukaan
- Masalah: Retakan dinding dan lantai pada 60% rumah

### Solusi Implementasi:

### Fase 1: Investigasi Detail
- Boring dan SPT: Setiap 50m untuk profil tanah
- Lab testing: PI, swell pressure, mineralogi
- Monitoring: Pergerakan tanah selama 1 tahun

### Fase 2: Remediasi
- Soil replacement: 1.5m top soil diganti sirtu
- Lime stabilization: 5% kapur untuk subgrade
- Improved drainage: Saluran keliling dan sumur resapan

### Fase 3: Struktur Adaptif
- Pondasi cakar ayam: Distribusi beban merata
- Flexible slab: Slab dengan expansion joints
- Reinforced walls: Tulangan tambahan pada dinding

### Hasil:
- Pengurangan kerusakan: 85% rumah tidak mengalami retakan baru
- Cost effectiveness: ROI 300% dalam 5 tahun
- Maintenance: Berkurang 70% dibanding sebelum perbaikan

## Rekomendasi Praktis

### Untuk Konsultan:
1. Investigasi menyeluruh: Jangan mengandalkan data umum
2. Seasonal monitoring: Observasi minimal 1 tahun
3. Conservative design: Gunakan faktor keamanan tinggi
4. Client education: Edukasi pentingnya maintenance

### Untuk Kontraktor:
1. Quality control: Kontrol ketat kadar air saat konstruksi
2. Proper curing: Waktu curing yang cukup untuk stabilisasi
3. Weather consideration: Hindari pekerjaan saat musim ekstrem
4. Documentation: Rekam semua kondisi dan treatment

### Untuk Owner:
1. Regular inspection: Inspeksi rutin setiap 6 bulan
2. Drainage maintenance: Jaga sistem drainase tetap berfungsi
3. Landscape management: Hindari tanaman besar dekat struktur
4. Professional consultation: Konsultasi ahli untuk masalah serius

## Kesimpulan

Tanah ekspansif merupakan tantangan geoteknik yang dapat diatasi dengan pendekatan komprehensif meliputi identifikasi yang tepat, desain yang sesuai, dan maintenance yang konsisten. Kunci keberhasilan terletak pada pemahaman mendalam karakteristik tanah lokal dan implementasi solusi yang disesuaikan dengan kondisi spesifik proyek.

Investasi awal yang lebih besar untuk investigasi dan treatment yang proper akan menghasilkan penghematan signifikan dalam jangka panjang melalui pengurangan biaya maintenance dan repair.

`,
    author: "David Harly Rizky Prabudhi, S.T.",
    authorTitle: "Geotechnical Engineer",
    publishDate: "2025-06-14",
    readTime: "15 menit",
    category: "Geoteknik",
    tags: ["Tanah Ekspansif", "Stabilisasi Tanah", "Montmorillonit", "Konstruksi", "Mitigasi"],
    featured: true
  }
];

export const blogCategories = [
  "Semua",
  "Geoteknik",
  "Struktur",
  "Konstruksi",
  "Teknologi"
];

export const featuredPosts = blogPosts.filter(post => post.featured); 