export const MAPS = [
  {
    id: 'istanbul',
    name: 'İstanbul',
    subtitle: 'Boğaz Esintisi',
    difficultyLabel: 'Kolay',
    difficultyStars: 1,
    difficultyColor: '#22c55e',
    landmarkText: 'Kız Kulesi • Galata Kulesi • Nostaljik Tramvay • Boğaz',
    description:
      'Geniş Arnavut kaldırımlı rıhtımlarda erguvanların altında kedileri topla. Kız Kulesi ve Galata silüeti seni selamlıyor!',
    arenaHalfWidth: 38,
    arenaHalfDepth: 28,
    targetCats: 15,
    baseSpeed: 10.5,
    turnSpeed: 5.8,
    scoreMultiplier: 1.0,
    maxStrayCats: 9,
    maxPowerups: 3,
    movingHazardCount: 1, // 1 red nostalgic tram cruising safely along a track!
    staticObstacleCount: 7,
    theme: {
      skyTop: '#38bdf8',
      skyBottom: '#fed7aa',
      fogColor: 0xbae6fd,
      groundColor: 0xd6cfc7, // Arnavut kaldırımı sıcak taş
      groundAccent: 0xb8afa6,
      waterColor: 0x0284c7, // Boğaz mavisi
      borderColor: 0xe2e8f0,
      sunColor: 0xfff3d6,
      ambientColor: 0xdbeafe,
      badgeBg: 'linear-gradient(135deg, #0ea5e9, #f97316)'
    }
  },
  {
    id: 'antalya',
    name: 'Antalya',
    subtitle: 'Akdeniz Güneşi',
    difficultyLabel: 'Orta',
    difficultyStars: 2,
    difficultyColor: '#f59e0b',
    landmarkText: 'Hadrian Kapısı • Yivli Minare • Düden Şelalesi • Kaleiçi',
    description:
      'Palmiyeler ve portakal ağaçları arasında ak. Hareketli plaj arabalarına ve şelale havuzlarına dikkat et!',
    arenaHalfWidth: 36,
    arenaHalfDepth: 26,
    targetCats: 20,
    baseSpeed: 12.2,
    turnSpeed: 6.2,
    scoreMultiplier: 1.4,
    maxStrayCats: 10,
    maxPowerups: 3,
    movingHazardCount: 2,
    staticObstacleCount: 10,
    theme: {
      skyTop: '#06b6d4',
      skyBottom: '#fef08a',
      fogColor: 0xa5f3fc,
      groundColor: 0xf4d5a6, // Akdeniz sıcak kumu & Kaleiçi taşı
      groundAccent: 0xe6be8a,
      waterColor: 0x06b6d4, // Turkuaz Akdeniz
      borderColor: 0xfef3c7,
      sunColor: 0xffe8a3,
      ambientColor: 0xfef9c3,
      badgeBg: 'linear-gradient(135deg, #f59e0b, #06b6d4)'
    }
  },
  {
    id: 'tokat',
    name: 'Tokat',
    subtitle: 'Yeşilırmak & Konaklar',
    difficultyLabel: 'Zor',
    difficultyStars: 3,
    difficultyColor: '#f97316',
    landmarkText: 'Saat Kulesi • Hıdırlık Köprüsü • Taşhan • Tokat Kalesi',
    description:
      'Taşhan kemerleri ve Yeşilırmak’ın tarihi köprü geçitlerinde hız artıyor! Pazar arabalarından ustaca sıyrıl.',
    arenaHalfWidth: 34,
    arenaHalfDepth: 25,
    targetCats: 24,
    baseSpeed: 13.8,
    turnSpeed: 6.7,
    scoreMultiplier: 1.9,
    maxStrayCats: 10,
    maxPowerups: 4,
    movingHazardCount: 3,
    staticObstacleCount: 13,
    theme: {
      skyTop: '#6366f1',
      skyBottom: '#fda4af',
      fogColor: 0xfecdd3,
      groundColor: 0xcab8a2, // Tarihi taş avlu
      groundAccent: 0xa8927a,
      waterColor: 0x10b981, // Yeşilırmak
      borderColor: 0x92400e,
      sunColor: 0xffd1b3,
      ambientColor: 0xfae8ff,
      badgeBg: 'linear-gradient(135deg, #e11d48, #f59e0b)'
    }
  },
  {
    id: 'artvin',
    name: 'Artvin',
    subtitle: 'Kaçkar Zirvesi',
    difficultyLabel: 'Uzman',
    difficultyStars: 4,
    difficultyColor: '#ef4444',
    landmarkText: 'Karagöl • Çifte Köprü • Serender Evleri • Mençuna Şelalesi',
    description:
      'Zümrüt Karagöl kıyısında ve sisli dağ köprülerinde en yüksek hız! Yuvarlanan kütükler arasında gerçek ustalık testi.',
    arenaHalfWidth: 32,
    arenaHalfDepth: 24,
    targetCats: 28,
    baseSpeed: 15.4,
    turnSpeed: 7.2,
    scoreMultiplier: 2.5,
    maxStrayCats: 11,
    maxPowerups: 4,
    movingHazardCount: 4,
    staticObstacleCount: 15,
    theme: {
      skyTop: '#0f766e',
      skyBottom: '#a7f3d0',
      fogColor: 0xa7f3d0,
      groundColor: 0x5f8d4e, // Zümrüt yayla çimi & ahşap yol
      groundAccent: 0x456e37,
      waterColor: 0x047857, // Karagöl zümrütü
      borderColor: 0x78350f,
      sunColor: 0xe0f2fe,
      ambientColor: 0xd1fae5,
      badgeBg: 'linear-gradient(135deg, #059669, #7c3aed)'
    }
  }
];

export function getMapById(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}
