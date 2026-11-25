export const CHARACTERS = [
  {
    id: 'efe',
    name: 'Efe',
    gender: 'Erkek',
    title: 'Mahalle Delikanlısı',
    tagline: 'Simit kokusuna bütün kediler koşar!',
    badge: '🇹🇷 Kasket & Nazar',
    bio: 'Kasketini yan takar, cebinden kuru mama ve çıtır simit hiç eksik olmaz. Nazar boncuklu bilekliğiyle sokakların kahramanı.',
    colors: {
      skin: 0xf4c29f,
      hair: 0x261b17,
      shirt: 0xf8f9fa,
      vest: 0xe63946, // Türk bayrağı kırmızısı yelek
      pants: 0x1d3557,
      shoes: 0xffffff,
      accent: 0x00b4d8, // Turkuaz detay
      cap: 0x2b2d42
    },
    hasMustache: true,
    hasCap: true,
    hasBag: false,
    propType: 'simit_pouch',
    cheerLines: [
      'Pisi pisi gelin bakalım!',
      'Bütün mahalle arkamda!',
      'Çaylar benden, mama sizden!',
      'Hey maşallah, kuyruk uzadı!'
    ]
  },
  {
    id: 'defne',
    name: 'Defne',
    gender: 'Kadın',
    title: 'Kedi Ablası',
    tagline: 'Çantasında her an bir ödül maması var!',
    badge: '🇹🇷 Lale & Turkuaz',
    bio: 'Ay-yıldızlı saç bandanası ve lale motifli bez çantasıyla İstanbul’dan Artvin’e kadar tüm patili dostların gözbebeği.',
    colors: {
      skin: 0xf7cbb0,
      hair: 0x3d2314,
      shirt: 0x06b6d4, // Canlı Turkuaz
      vest: 0xff4d6d, // Mercan kırmızı hırka
      pants: 0x2b2d42,
      shoes: 0xffd166,
      accent: 0xe63946,
      bandana: 0xe63946
    },
    hasMustache: false,
    hasCap: false,
    hasBag: true,
    propType: 'cat_wand',
    cheerLines: [
      'Gelin kuzularım benim!',
      'Nazar değmesin size!',
      'Patili ordu büyüyor!',
      'Harikasınız tatlı kediler!'
    ]
  }
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
