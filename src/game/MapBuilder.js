import * as THREE from 'three';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.65,
    metalness: opts.metalness ?? 0.06,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1
  });
}

function shadow(m, cast = true, receive = true) {
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Create decorative stylized tree (Erguvan pink, Palm, Apple/Poplar, Pine)
function createCityTree(kind) {
  const g = new THREE.Group();
  if (kind === 'palm') {
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 4.6, 8), mat(0x92400e)));
    trunk.position.y = 2.3;
    g.add(trunk);
    const leafMat = mat(0x16a34a, { roughness: 0.55 });
    for (let i = 0; i < 6; i++) {
      const leaf = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.5, 5), leafMat));
      leaf.position.y = 4.6;
      leaf.rotation.z = Math.PI / 2.4;
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      g.add(leaf);
    }
  } else if (kind === 'orange') {
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 8), mat(0x78350f)));
    trunk.position.y = 0.9;
    const crown = shadow(new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 10), mat(0x15803d)));
    crown.position.y = 2.6;
    g.add(trunk, crown);
    const orangeMat = mat(0xf97316, { emissive: 0xea580c, emissiveIntensity: 0.15 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const o = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), orangeMat);
      o.position.set(Math.cos(a) * 1.1, 2.4 + (i % 2) * 0.4, Math.sin(a) * 1.1);
      g.add(o);
    }
  } else if (kind === 'erguvan') {
    // Istanbul pink Judas tree
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 2.0, 8), mat(0x5c3a21)));
    trunk.position.y = 1.0;
    const c1 = shadow(new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), mat(0xec4899, { roughness: 0.6 })));
    c1.position.y = 2.8;
    const c2 = shadow(new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), mat(0xf472b6, { roughness: 0.6 })));
    c2.position.set(0.65, 3.3, 0.4);
    g.add(trunk, c1, c2);
  } else {
    // Artvin / Tokat pine
    const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.8, 8), mat(0x451a03)));
    trunk.position.y = 0.9;
    const pineMat = mat(0x065f46);
    const c1 = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.2, 7), pineMat));
    c1.position.y = 2.2;
    const c2 = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.9, 7), mat(0x047857)));
    c2.position.y = 3.4;
    const c3 = shadow(new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.5, 7), mat(0x10b981)));
    c3.position.y = 4.4;
    g.add(trunk, c1, c2, c3);
  }
  return g;
}

// Landmark builders outside/around arena borders so players always see iconic city sights!
function addIstanbulLandmarks(group, hw, hd) {
  // 1. Kız Kulesi (Maiden's Tower) in the Bosphorus water (top-right corner)
  const kiz = new THREE.Group();
  kiz.position.set(hw + 10, 0, -hd - 7);
  const island = shadow(new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 1.2, 16), mat(0xd6d3d1)));
  island.position.y = 0.2;
  const baseWall = shadow(new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 5.2), mat(0xfef3c7)));
  baseWall.position.y = 2.2;
  const tower = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 6.4, 14), mat(0xfef9c3)));
  tower.position.y = 5.6;
  const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.6, 14), mat(0xb91c1c)));
  roof.position.y = 9.9;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 8), mat(0xfbbf24));
  spire.position.y = 11.4;
  kiz.add(island, baseWall, tower, roof, spire);
  group.add(kiz);

  // 2. Galata Kulesi (top-left)
  const galata = new THREE.Group();
  galata.position.set(-hw - 9, 0, -hd - 7);
  const gTower = shadow(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 12.5, 18), mat(0xd6ccc2)));
  gTower.position.y = 6.2;
  const gBalcony = shadow(new THREE.Mesh(new THREE.CylinderGeometry(3.0, 2.8, 0.8, 18), mat(0x78716c)));
  gBalcony.position.y = 12.2;
  const gRoof = shadow(new THREE.Mesh(new THREE.ConeGeometry(2.9, 4.4, 18), mat(0x334155)));
  gRoof.position.y = 14.8;
  const gTip = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), mat(0xfbbf24, { emissive: 0xd97706, emissiveIntensity: 0.4 }));
  gTip.position.y = 17.2;
  galata.add(gTower, gBalcony, gRoof, gTip);
  group.add(galata);

  // 3. Bosphorus Bridge pylons along the far north horizon
  [-16, 16].forEach((bx) => {
    const pylon = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.4, 11, 1.4), mat(0xf8fafc)));
    pylon.position.set(bx, 5.5, -hd - 15);
    group.add(pylon);
  });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(62, 0.8, 2.2), mat(0xe2e8f0));
  deck.position.set(0, 4.5, -hd - 15);
  group.add(deck);

  // Erguvan trees around the perimeter
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const t = createCityTree('erguvan');
    t.position.set(i * 11, 0, -hd - 3.5);
    group.add(t);
  }
}

function addAntalyaLandmarks(group, hw, hd) {
  // 1. Yivli Minare (Fluted brick minaret, top-left)
  const yivli = new THREE.Group();
  yivli.position.set(-hw - 8, 0, -hd - 6);
  const plinth = shadow(new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 4.2), mat(0xe7e5e4)));
  plinth.position.y = 2.1;
  const shaft = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 10.5, 8), mat(0xc2410c)));
  shaft.position.y = 9.0;
  const cap = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.0, 12), mat(0x0284c7)));
  cap.position.y = 15.6;
  yivli.add(plinth, shaft, cap);
  group.add(yivli);

  // 2. Hadrian's Gate (Üçkapılar) triple arch monument on north border
  const gate = new THREE.Group();
  gate.position.set(0, 0, -hd - 5);
  for (let x = -7; x <= 7; x += 4.6) {
    const col = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.2, 2.0), mat(0xfef3c7)));
    col.position.set(x, 3.1, 0);
    gate.add(col);
  }
  const entablature = shadow(new THREE.Mesh(new THREE.BoxGeometry(17, 1.8, 2.4), mat(0xfde68a)));
  entablature.position.set(0, 6.8, 0);
  gate.add(entablature);
  group.add(gate);

  // 3. Düden Waterfall cliff (top-right)
  const cliff = new THREE.Group();
  cliff.position.set(hw + 8, 0, -hd - 5);
  const rock = shadow(new THREE.Mesh(new THREE.BoxGeometry(10, 7.5, 7), mat(0xa8a29e)));
  rock.position.y = 3.5;
  const falls = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 7.2, 0.8),
    mat(0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.4, transparent: true, opacity: 0.86 })
  );
  falls.position.set(0, 3.5, 3.6);
  cliff.add(rock, falls);
  group.add(cliff);

  // Palm & Orange trees outside border
  for (let i = -3; i <= 3; i++) {
    const t = createCityTree(i % 2 === 0 ? 'palm' : 'orange');
    t.position.set(i * 10.5, 0, -hd - 2.8);
    if (Math.abs(i) > 1) group.add(t);
  }
}

function addTokatLandmarks(group, hw, hd) {
  // 1. Tokat Saat Kulesi (Clock Tower, top-left)
  const tower = new THREE.Group();
  tower.position.set(-hw - 7, 0, -hd - 6);
  const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(3.8, 12.0, 3.8), mat(0xe7d8c5)));
  body.position.y = 6.0;
  const clockFace = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.25, 16),
    mat(0xffffff, { emissive: 0xfef08a, emissiveIntensity: 0.4 })
  );
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 10.0, 1.95);
  const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.2, 4), mat(0x78350f)));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 13.6;
  tower.add(body, clockFace, roof);
  group.add(tower);

  // 2. Tokat Castle rocky hill (top-right)
  const castle = new THREE.Group();
  castle.position.set(hw + 9, 0, -hd - 7);
  const hill = shadow(new THREE.Mesh(new THREE.ConeGeometry(8.5, 8.0, 7), mat(0x78716c)));
  hill.position.y = 4.0;
  const keep = shadow(new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 4.2), mat(0xd6d3d1)));
  keep.position.y = 8.0;
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 6), mat(0xffffff));
  flagPole.position.y = 11.2;
  const flag = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.1), mat(0xe63946, { emissive: 0x991b1b, emissiveIntensity: 0.25 }));
  flag.position.set(1.0, 12.1, 0);
  castle.add(hill, keep, flagPole, flag);
  group.add(castle);

  // 3. Hıdırlık Bridge arches spanning north edge
  const bridge = new THREE.Group();
  bridge.position.set(0, 0, -hd - 4.5);
  const span = shadow(new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 3.6), mat(0xb49a7e)));
  span.position.y = 2.8;
  bridge.add(span);
  for (let x = -10; x <= 10; x += 5) {
    const pier = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.6, 4.0), mat(0x967c60)));
    pier.position.set(x, 1.8, 0);
    bridge.add(pier);
  }
  group.add(bridge);
}

function addArtvinLandmarks(group, hw, hd) {
  // 1. Traditional Black Sea Serender wooden stilted granary (top-left)
  const serender = new THREE.Group();
  serender.position.set(-hw - 7, 0, -hd - 5);
  [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([sx, sz]) => {
    const post = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 3.0, 8), mat(0x78350f)));
    post.position.set(sx, 1.5, sz);
    serender.add(post);
  });
  const cabin = shadow(new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.8, 4.6), mat(0xb45309)));
  cabin.position.y = 4.2;
  const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.4, 4), mat(0x3f2305)));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 6.8;
  serender.add(cabin, roof);
  group.add(serender);

  // 2. Mençuna Waterfall & Kaçkar mountain cliff (top-right)
  const mCliff = new THREE.Group();
  mCliff.position.set(hw + 9, 0, -hd - 6);
  const mountain = shadow(new THREE.Mesh(new THREE.ConeGeometry(9.5, 13, 6), mat(0x374151)));
  mountain.position.y = 6.5;
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 9.5, 0.8),
    mat(0x6ee7b7, { emissive: 0x10b981, emissiveIntensity: 0.45, transparent: true, opacity: 0.9 })
  );
  water.position.set(-1.5, 4.8, 4.6);
  water.rotation.x = -0.3;
  mCliff.add(mountain, water);
  group.add(mCliff);

  // 3. Çifte Köprü stone arch & lush Kaçkar pines
  for (let i = -3; i <= 3; i++) {
    const t = createCityTree('pine');
    t.position.set(i * 9.5, 0, -hd - 4.0);
    group.add(t);
  }
}

function createObstacleMesh(mapId, index) {
  const g = new THREE.Group();
  let radius = 1.45;

  if (mapId === 'istanbul') {
    if (index % 3 === 0) {
      // Simit vendor cart!
      const cart = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.6), mat(0xe63946)));
      cart.position.y = 0.9;
      const glass = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.4), mat(0xfef3c7, { transparent: true, opacity: 0.7 })));
      glass.position.y = 1.9;
      const awning = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 1.9), mat(0xffffff)));
      awning.position.y = 2.6;
      g.add(cart, glass, awning);
      radius = 1.55;
    } else if (index % 3 === 1) {
      const t = createCityTree('erguvan');
      g.add(t);
      radius = 1.35;
    } else {
      // Stone fountain / flower planter
      const pot = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 1.0, 10), mat(0x94a3b8)));
      pot.position.y = 0.5;
      const bush = shadow(new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), mat(0x22c55e)));
      bush.position.y = 1.25;
      g.add(pot, bush);
      radius = 1.35;
    }
  } else if (mapId === 'antalya') {
    if (index % 3 === 0) {
      const t = createCityTree('palm');
      g.add(t);
      radius = 1.1;
    } else if (index % 3 === 1) {
      const t = createCityTree('orange');
      g.add(t);
      radius = 1.35;
    } else {
      // Beach umbrella + table
      const pole = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6), mat(0xf8fafc)));
      pole.position.y = 1.2;
      const top = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.8, 8), mat(index % 2 === 0 ? 0xf97316 : 0x06b6d4)));
      top.position.y = 2.5;
      g.add(pole, top);
      radius = 1.4;
    }
  } else if (mapId === 'tokat') {
    if (index % 3 === 0) {
      // Tokat Yazması patterned market stall
      const base = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.6), mat(0x92400e)));
      base.position.y = 0.6;
      const roof = shadow(new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), mat(0xe11d48)));
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 2.5;
      g.add(base, roof);
      radius = 1.5;
    } else if (index % 3 === 1) {
      // Stone archway pillar (Taşhan)
      const pillar = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 1.8), mat(0xd6ccc2)));
      pillar.position.y = 1.6;
      g.add(pillar);
      radius = 1.35;
    } else {
      const t = createCityTree('pine');
      g.add(t);
      radius = 1.35;
    }
  } else {
    // Artvin
    if (index % 2 === 0) {
      const t = createCityTree('pine');
      g.add(t);
      radius = 1.4;
    } else {
      // Mossy Kaçkar boulder + tea bush
      const rock = shadow(new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 0), mat(0x64748b)));
      rock.position.y = 0.9;
      const moss = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 8), mat(0x10b981)));
      moss.position.set(0.4, 1.2, 0.3);
      g.add(rock, moss);
      radius = 1.45;
    }
  }

  return { mesh: g, radius };
}

function createMovingHazardMesh(mapId) {
  const g = new THREE.Group();
  let radius = 1.4;

  if (mapId === 'istanbul') {
    // Iconic Red Nostalgic Tram!
    const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4.2), mat(0xdc2626)));
    body.position.y = 1.3;
    const roof = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.35, 4.3), mat(0xfef3c7)));
    roof.position.y = 2.5;
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.85, 3.2), mat(0xbae6fd, { emissive: 0x38bdf8, emissiveIntensity: 0.25 }));
    win.position.y = 1.6;
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mat(0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.8 }));
    headlight.position.set(0, 0.9, 2.15);
    g.add(body, roof, win, headlight);
    radius = 1.75;
  } else if (mapId === 'antalya') {
    // Bright Orange Tourist Beach Buggy / Cart
    const body = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 2.8), mat(0xf97316)));
    body.position.y = 0.8;
    const canopy = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 2.6), mat(0xffffff)));
    canopy.position.y = 2.1;
    g.add(body, canopy);
    radius = 1.45;
  } else if (mapId === 'tokat') {
    // Pazar Wooden Handcart full of apples
    const cart = shadow(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 2.6), mat(0x92400e)));
    cart.position.y = 0.75;
    const apples = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), mat(0xe11d48)));
    apples.scale.set(1.2, 0.65, 1.4);
    apples.position.y = 1.35;
    g.add(cart, apples);
    radius = 1.45;
  } else {
    // Rolling Kaçkar Pine Log
    const log = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 3.0, 12), mat(0x78350f)));
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.95;
    g.add(log);
    radius = 1.45;
  }

  // Danger indicator ring on ground so players can dodge cleanly!
  const warnRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.85, radius * 1.08, 24),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
  );
  warnRing.rotation.x = -Math.PI / 2;
  warnRing.position.y = 0.05;
  g.add(warnRing);

  return { mesh: g, radius };
}

export function buildCityMap(scene, mapConfig) {
  const mapGroup = new THREE.Group();
  const hw = mapConfig.arenaHalfWidth;
  const hd = mapConfig.arenaHalfDepth;
  const t = mapConfig.theme;

  // 1. Surrounding Water / Valley Backdrop
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 220),
    mat(t.waterColor, { roughness: 0.22, metalness: 0.18 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.55;
  water.receiveShadow = true;
  mapGroup.add(water);

  // 2. Main Raised Arena Platform
  const platform = shadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(hw * 2 + 2, 1.2, hd * 2 + 2),
      mat(t.groundColor, { roughness: 0.85 })
    ),
    false,
    true
  );
  platform.position.y = -0.6;
  mapGroup.add(platform);

  // Decorative tile / cobblestone checker accents on floor
  const tileGeo = new THREE.PlaneGeometry(3.8, 3.8);
  const tileMat = mat(t.groundAccent, { roughness: 0.9 });
  for (let x = -hw + 3; x < hw - 2; x += 6.5) {
    for (let z = -hd + 3; z < hd - 2; z += 6.5) {
      if ((Math.round(x) + Math.round(z)) % 2 === 0) {
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x, 0.008, z);
        tile.receiveShadow = true;
        mapGroup.add(tile);
      }
    }
  }

  // 3. Perimeter Border Fence / Stone Curb
  const curbMat = mat(t.borderColor, { roughness: 0.55 });
  const curbTop = shadow(new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 2.4, 0.9, 1.1), curbMat));
  curbTop.position.set(0, 0.45, -hd - 0.55);
  const curbBot = shadow(new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 2.4, 0.9, 1.1), curbMat));
  curbBot.position.set(0, 0.45, hd + 0.55);
  const curbLeft = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, hd * 2 + 2.4), curbMat));
  curbLeft.position.set(-hw - 0.55, 0.45, 0);
  const curbRight = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, hd * 2 + 2.4), curbMat));
  curbRight.position.set(hw + 0.55, 0.45, 0);
  mapGroup.add(curbTop, curbBot, curbLeft, curbRight);

  // Corner lanterns!
  const lanternMat = mat(0xfef08a, { emissive: 0xfbbf24, emissiveIntensity: 0.9 });
  [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([lx, lz]) => {
    const post = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.0, 8), mat(0x1e293b)));
    post.position.set(lx, 1.5, lz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), lanternMat);
    bulb.position.set(lx, 3.2, lz);
    mapGroup.add(post, bulb);
  });

  // 4. City Landmarks
  if (mapConfig.id === 'istanbul') addIstanbulLandmarks(mapGroup, hw, hd);
  else if (mapConfig.id === 'antalya') addAntalyaLandmarks(mapGroup, hw, hd);
  else if (mapConfig.id === 'tokat') addTokatLandmarks(mapGroup, hw, hd);
  else addArtvinLandmarks(mapGroup, hw, hd);

  // 5. Static Playable Obstacles (keep center spawn area around (0,2) clear!)
  const obstacles = [];
  let attempts = 0;
  while (obstacles.length < mapConfig.staticObstacleCount && attempts < 180) {
    attempts++;
    const ox = (Math.random() * 2 - 1) * (hw - 5.5);
    const oz = (Math.random() * 2 - 1) * (hd - 5.5);
    if (Math.hypot(ox, oz - 2) < 9.5) continue; // Safe player start zone!
    if (obstacles.some((o) => Math.hypot(o.x - ox, o.z - oz) < 6.2)) continue;

    const { mesh, radius } = createObstacleMesh(mapConfig.id, obstacles.length);
    mesh.position.set(ox, 0, oz);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mapGroup.add(mesh);
    obstacles.push({ x: ox, z: oz, radius, mesh });
  }

  // 6. Moving Hazards (Patrolling lanes clear of player spawn at (0,0))
  const movingHazards = [];
  for (let i = 0; i < mapConfig.movingHazardCount; i++) {
    const { mesh, radius } = createMovingHazardMesh(mapConfig.id);
    const laneZ = i % 2 === 0 ? -(hd * 0.48 + i * 2) : hd * 0.48 - i * 1.5;
    const clampedZ = Math.max(-hd + 4, Math.min(hd - 4, laneZ));
    // Ensure it never passes through (0,0) spawn!
    const safeZ = Math.abs(clampedZ) < 5.5 ? (clampedZ >= 0 ? 7.5 : -7.5) : clampedZ;
    const speed = (5.2 + i * 1.4) * (i % 2 === 0 ? 1 : -1);
    const range = hw - 4.5;

    // Draw subtle patrol rail/track line
    const track = new THREE.Mesh(
      new THREE.PlaneGeometry(range * 2, 0.45),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
    );
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, 0.02, safeZ);
    mapGroup.add(track);

    mesh.position.set(0, 0, safeZ);
    mesh.rotation.y = speed > 0 ? Math.PI / 2 : -Math.PI / 2;
    mapGroup.add(mesh);
    movingHazards.push({
      mesh,
      x: 0,
      z: safeZ,
      vx: speed,
      range,
      radius
    });
  }

  scene.add(mapGroup);
  return { mapGroup, obstacles, movingHazards };
}
