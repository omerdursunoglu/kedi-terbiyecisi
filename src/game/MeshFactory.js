import * as THREE from 'three';

const _geoCache = new Map();
function getSharedGeo(key, factory) {
  if (!_geoCache.has(key)) {
    _geoCache.set(key, factory());
  }
  return _geoCache.get(key);
}

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.45,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1
  });
}

function addShadow(mesh, cast = true, receive = false) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

export function createNazarAmulet(scale = 1) {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    getSharedGeo('nazarOuter', () => new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20)),
    makeMat(0x0b3c91, { roughness: 0.2, metalness: 0.15, emissive: 0x0a2e7a, emissiveIntensity: 0.25 })
  );
  outer.rotation.x = Math.PI / 2;

  const white = new THREE.Mesh(
    getSharedGeo('nazarWhite', () => new THREE.CylinderGeometry(0.21, 0.21, 0.09, 18)),
    makeMat(0xffffff, { roughness: 0.25 })
  );
  white.rotation.x = Math.PI / 2;

  const cyan = new THREE.Mesh(
    getSharedGeo('nazarCyan', () => new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16)),
    makeMat(0x00b4d8, { roughness: 0.2, emissive: 0x0096c7, emissiveIntensity: 0.2 })
  );
  cyan.rotation.x = Math.PI / 2;

  const pupil = new THREE.Mesh(
    getSharedGeo('nazarPupil', () => new THREE.CylinderGeometry(0.06, 0.06, 0.11, 14)),
    makeMat(0x0f172a, { roughness: 0.1 })
  );
  pupil.rotation.x = Math.PI / 2;

  group.add(outer, white, cyan, pupil);
  group.scale.setScalar(scale);
  return group;
}

export function createCharacterMesh(charData) {
  const root = new THREE.Group();
  const c = charData.colors;

  // Ground shadow disc (fast crisp contact shadow)
  const blobShadow = new THREE.Mesh(
    getSharedGeo('charShadow', () => new THREE.CircleGeometry(0.85, 24)),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
  );
  blobShadow.rotation.x = -Math.PI / 2;
  blobShadow.position.y = 0.03;
  root.add(blobShadow);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Legs
  const legGeo = getSharedGeo('charLeg', () => new THREE.CapsuleGeometry(0.17, 0.42, 6, 10));
  const pantsMat = makeMat(c.pants, { roughness: 0.65 });
  const shoeMat = makeMat(c.shoes, { roughness: 0.35 });
  const shoeGeo = getSharedGeo('charShoe', () => new THREE.BoxGeometry(0.28, 0.18, 0.42));

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.24, 0.52, 0);
  const lLegMesh = addShadow(new THREE.Mesh(legGeo, pantsMat));
  const lShoe = addShadow(new THREE.Mesh(shoeGeo, shoeMat));
  lShoe.position.set(0, -0.34, 0.08);
  leftLeg.add(lLegMesh, lShoe);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.24, 0.52, 0);
  const rLegMesh = addShadow(new THREE.Mesh(legGeo, pantsMat));
  const rShoe = addShadow(new THREE.Mesh(shoeGeo, shoeMat));
  rShoe.position.set(0, -0.34, 0.08);
  rightLeg.add(rLegMesh, rShoe);

  bodyPivot.add(leftLeg, rightLeg);

  // Torso (Shirt + Turkish Red/Coral Vest)
  const torso = addShadow(
    new THREE.Mesh(
      getSharedGeo('charTorso', () => new THREE.CylinderGeometry(0.42, 0.48, 0.92, 16)),
      makeMat(c.shirt, { roughness: 0.5 })
    )
  );
  torso.position.y = 1.18;
  bodyPivot.add(torso);

  const vest = addShadow(
    new THREE.Mesh(
      getSharedGeo('charVest', () => new THREE.CylinderGeometry(0.45, 0.50, 0.72, 16, 1, false, 0.25, Math.PI * 1.85)),
      makeMat(c.vest, { roughness: 0.48 })
    )
  );
  vest.position.y = 1.22;
  vest.rotation.y = Math.PI * 0.58;
  bodyPivot.add(vest);

  // Turkish crescent-star badge on chest / back
  const badge = new THREE.Mesh(
    getSharedGeo('badgeDisc', () => new THREE.CylinderGeometry(0.14, 0.14, 0.04, 16)),
    makeMat(0xe63946, { emissive: 0x991b1b, emissiveIntensity: 0.2 })
  );
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0.18, 1.38, 0.44);
  bodyPivot.add(badge);

  const star = new THREE.Mesh(
    getSharedGeo('badgeWhite', () => new THREE.OctahedronGeometry(0.06, 0)),
    makeMat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.3 })
  );
  star.position.set(0.18, 1.38, 0.47);
  bodyPivot.add(star);

  // Nazar necklace
  const nazar = createNazarAmulet(0.45);
  nazar.position.set(0, 1.54, 0.43);
  bodyPivot.add(nazar);

  // Arms
  const armGeo = getSharedGeo('charArm', () => new THREE.CapsuleGeometry(0.14, 0.48, 6, 10));
  const armMat = makeMat(c.shirt, { roughness: 0.5 });
  const handMat = makeMat(c.skin, { roughness: 0.55 });
  const handGeo = getSharedGeo('charHand', () => new THREE.SphereGeometry(0.15, 10, 10));

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.56, 1.48, 0);
  const lArmMesh = addShadow(new THREE.Mesh(armGeo, armMat));
  lArmMesh.position.y = -0.24;
  const lHand = new THREE.Mesh(handGeo, handMat);
  lHand.position.y = -0.52;
  leftArm.add(lArmMesh, lHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.56, 1.48, 0);
  const rArmMesh = addShadow(new THREE.Mesh(armGeo, armMat));
  rArmMesh.position.y = -0.24;
  const rHand = new THREE.Mesh(handGeo, handMat);
  rHand.position.y = -0.52;
  rightArm.add(rArmMesh, rHand);

  // Prop in right hand!
  if (charData.propType === 'simit_pouch') {
    const simit = new THREE.Mesh(
      getSharedGeo('handSimit', () => new THREE.TorusGeometry(0.2, 0.075, 10, 18)),
      makeMat(0xd97706, { roughness: 0.6 })
    );
    simit.position.set(0, -0.56, 0.22);
    simit.rotation.y = Math.PI / 2;
    rightArm.add(simit);
  } else {
    // Cat wand toy
    const wand = new THREE.Mesh(
      getSharedGeo('wandStick', () => new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8)),
      makeMat(0xfbbf24)
    );
    wand.rotation.x = Math.PI / 3;
    wand.position.set(0, -0.45, 0.35);
    const feather = new THREE.Mesh(
      getSharedGeo('wandFeather', () => new THREE.ConeGeometry(0.14, 0.3, 8)),
      makeMat(0xff4d6d, { emissive: 0xff4d6d, emissiveIntensity: 0.25 })
    );
    feather.position.set(0, -0.25, 0.72);
    feather.rotation.x = Math.PI / 2;
    rightArm.add(wand, feather);
  }

  // Tote bag for Defne
  if (charData.hasBag) {
    const bag = addShadow(
      new THREE.Mesh(
        getSharedGeo('toteBag', () => new THREE.BoxGeometry(0.28, 0.45, 0.42)),
        makeMat(0xfef3c7, { roughness: 0.7 })
      )
    );
    bag.position.set(-0.56, 0.98, -0.05);
    const bagNazar = createNazarAmulet(0.38);
    bagNazar.rotation.y = -Math.PI / 2;
    bagNazar.position.set(-0.71, 1.0, -0.05);
    bodyPivot.add(bag, bagNazar);
  }

  bodyPivot.add(leftArm, rightArm);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.02, 0);
  const headMesh = addShadow(
    new THREE.Mesh(
      getSharedGeo('charHead', () => new THREE.SphereGeometry(0.46, 18, 16)),
      makeMat(c.skin, { roughness: 0.5 })
    )
  );
  headGroup.add(headMesh);

  // Eyes
  const eyeGeo = getSharedGeo('charEye', () => new THREE.SphereGeometry(0.065, 10, 10));
  const eyeMat = makeMat(0x1e293b, { roughness: 0.15 });
  const lEye = new THREE.Mesh(eyeGeo, eyeMat);
  lEye.position.set(-0.16, 0.05, 0.41);
  const rEye = new THREE.Mesh(eyeGeo, eyeMat);
  rEye.position.set(0.16, 0.05, 0.41);
  headGroup.add(lEye, rEye);

  // Rosy cheeks
  const cheekGeo = getSharedGeo('charCheek', () => new THREE.SphereGeometry(0.075, 8, 8));
  const cheekMat = makeMat(0xfb7185, { roughness: 0.7 });
  const lCheek = new THREE.Mesh(cheekGeo, cheekMat);
  lCheek.scale.set(1, 0.6, 0.5);
  lCheek.position.set(-0.26, -0.06, 0.36);
  const rCheek = new THREE.Mesh(cheekGeo, cheekMat);
  rCheek.scale.set(1, 0.6, 0.5);
  rCheek.position.set(0.26, -0.06, 0.36);
  headGroup.add(lCheek, rCheek);

  // Hair & Turkish Headgear
  const hairMat = makeMat(c.hair, { roughness: 0.65 });
  const hairCap = addShadow(
    new THREE.Mesh(
      getSharedGeo('charHairCap', () => new THREE.SphereGeometry(0.49, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58)),
      hairMat
    )
  );
  hairCap.rotation.x = -0.22;
  headGroup.add(hairCap);

  if (charData.hasMustache) {
    // Classic warm Turkish mustache!
    const mGeo = getSharedGeo('mustacheWing', () => new THREE.CapsuleGeometry(0.045, 0.14, 4, 8));
    const mL = new THREE.Mesh(mGeo, hairMat);
    mL.rotation.z = 1.25;
    mL.position.set(-0.1, -0.1, 0.44);
    const mR = new THREE.Mesh(mGeo, hairMat);
    mR.rotation.z = -1.25;
    mR.position.set(0.1, -0.1, 0.44);
    headGroup.add(mL, mR);
  }

  if (charData.hasCap) {
    // Stylish Turkish neighborhood cap (kasket)
    const capMat = makeMat(c.cap, { roughness: 0.55 });
    const crown = addShadow(
      new THREE.Mesh(
        getSharedGeo('kasketCrown', () => new THREE.CylinderGeometry(0.46, 0.50, 0.24, 16)),
        capMat
      )
    );
    crown.position.set(0, 0.36, -0.02);
    const visor = new THREE.Mesh(
      getSharedGeo('kasketVisor', () => new THREE.CylinderGeometry(0.46, 0.46, 0.06, 16, 1, false, -Math.PI * 0.4, Math.PI * 0.8)),
      makeMat(0xe63946)
    );
    visor.position.set(0, 0.26, 0.22);
    headGroup.add(crown, visor);
  } else {
    // Ponytail + Red Turkish bandana for Defne!
    const pony = addShadow(
      new THREE.Mesh(
        getSharedGeo('ponytail', () => new THREE.CapsuleGeometry(0.15, 0.45, 6, 10)),
        hairMat
      )
    );
    pony.position.set(0, 0.05, -0.52);
    pony.rotation.x = 0.45;

    const bandana = new THREE.Mesh(
      getSharedGeo('bandana', () => new THREE.TorusGeometry(0.47, 0.075, 8, 20)),
      makeMat(c.bandana || 0xe63946, { roughness: 0.4 })
    );
    bandana.rotation.x = Math.PI / 2 - 0.25;
    bandana.position.set(0, 0.24, -0.02);

    // Side hair locks
    const sideLockGeo = getSharedGeo('sideLock', () => new THREE.CapsuleGeometry(0.1, 0.28, 4, 8));
    const lLock = new THREE.Mesh(sideLockGeo, hairMat);
    lLock.position.set(-0.42, -0.06, 0.08);
    const rLock = new THREE.Mesh(sideLockGeo, hairMat);
    rLock.position.set(0.42, -0.06, 0.08);

    headGroup.add(pony, bandana, lLock, rLock);
  }

  bodyPivot.add(headGroup);

  // Protective Nazar Shield Bubble (hidden until active)
  const shieldBubble = new THREE.Mesh(
    getSharedGeo('shieldSphere', () => new THREE.SphereGeometry(1.45, 22, 18)),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1
    })
  );
  shieldBubble.position.y = 1.2;
  shieldBubble.visible = false;
  root.add(shieldBubble);

  // Magnet / Boost ring
  const auraRing = new THREE.Mesh(
    getSharedGeo('auraRing', () => new THREE.RingGeometry(1.15, 1.45, 28)),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.08;
  root.add(auraRing);

  root.userData = {
    bodyPivot,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    headGroup,
    shieldBubble,
    auraRing
  };

  return root;
}

export function createCatMesh(breed, isStray = false) {
  const root = new THREE.Group();

  // Contact shadow
  const shadow = new THREE.Mesh(
    getSharedGeo('catShadow', () => new THREE.CircleGeometry(0.55, 18)),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  // Optional glowing pickup ring for stray cats on the street
  let pickupRing = null;
  if (isStray) {
    const ringColor =
      breed.rarity === 'Efsanevi'
        ? 0xfbbf24
        : breed.rarity === 'Destansı'
          ? 0xc084fc
          : breed.rarity === 'Ender'
            ? 0x38bdf8
            : 0x4ade80;
    pickupRing = new THREE.Mesh(
      getSharedGeo('catRing', () => new THREE.RingGeometry(0.68, 0.88, 24)),
      new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72
      })
    );
    pickupRing.rotation.x = -Math.PI / 2;
    pickupRing.position.y = 0.04;
    root.add(pickupRing);
  }

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const isGold = breed.pattern === 'gradient_gold';
  const isRainbow = breed.pattern === 'rainbow';
  const bodyMat = makeMat(breed.bodyColor, {
    roughness: isGold ? 0.25 : 0.55,
    metalness: isGold ? 0.45 : 0.05,
    emissive: isGold ? 0x78350f : isRainbow ? 0x581c87 : 0x000000,
    emissiveIntensity: isGold || isRainbow ? 0.28 : 0
  });
  const bellyMat = makeMat(breed.bellyColor, { roughness: 0.6 });
  const stripeMat = makeMat(breed.stripeColor, { roughness: 0.6 });

  // Plump cat body
  const fluff = breed.fluff || 1.0;
  const body = addShadow(
    new THREE.Mesh(
      getSharedGeo('catBody', () => new THREE.CapsuleGeometry(0.32, 0.46, 6, 12)),
      bodyMat
    )
  );
  body.rotation.x = Math.PI / 2;
  body.scale.set(fluff, 1, fluff * 0.95);
  body.position.set(0, 0.44, 0);
  bodyPivot.add(body);

  // Belly bib / tuxedo chest
  if (breed.pattern === 'tuxedo' || breed.pattern === 'calico' || breed.pattern === 'tabby') {
    const chest = new THREE.Mesh(
      getSharedGeo('catChest', () => new THREE.SphereGeometry(0.25, 10, 10)),
      bellyMat
    );
    chest.position.set(0, 0.42, 0.28);
    chest.scale.set(0.85, 0.9, 0.7);
    bodyPivot.add(chest);
  }

  // Stripes / Spots / Calico patches
  if (breed.pattern === 'tabby' || breed.pattern === 'rainbow') {
    for (let i = -1; i <= 1; i++) {
      const sColor =
        breed.pattern === 'rainbow' ? [0x38bdf8, 0xfacc15, 0x4ade80][i + 1] : breed.stripeColor;
      const stripe = new THREE.Mesh(
        getSharedGeo('catStripe', () => new THREE.TorusGeometry(0.31, 0.045, 6, 14, Math.PI)),
        makeMat(sColor, { roughness: 0.5 })
      );
      stripe.rotation.y = Math.PI / 2;
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(0, 0.48, i * 0.16);
      stripe.scale.setScalar(fluff * 0.98);
      bodyPivot.add(stripe);
    }
  } else if (breed.pattern === 'calico') {
    const patch1 = new THREE.Mesh(
      getSharedGeo('catPatch', () => new THREE.SphereGeometry(0.18, 8, 8)),
      stripeMat
    );
    patch1.position.set(0.2, 0.56, 0.05);
    const patch2 = new THREE.Mesh(
      getSharedGeo('catPatch', () => new THREE.SphereGeometry(0.18, 8, 8)),
      makeMat(breed.patchColor || 0x1f2937)
    );
    patch2.position.set(-0.18, 0.54, -0.14);
    bodyPivot.add(patch1, patch2);
  } else if (breed.pattern === 'spotted') {
    const spotA = new THREE.Mesh(
      getSharedGeo('catSpot', () => new THREE.SphereGeometry(0.13, 8, 8)),
      stripeMat
    );
    spotA.position.set(0.22, 0.55, -0.08);
    const spotB = new THREE.Mesh(
      getSharedGeo('catSpot', () => new THREE.SphereGeometry(0.13, 8, 8)),
      stripeMat
    );
    spotB.position.set(-0.2, 0.52, 0.12);
    bodyPivot.add(spotA, spotB);
  }

  // Cute stubby paws
  const pawGeo = getSharedGeo('catPaw', () => new THREE.SphereGeometry(0.11, 8, 8));
  const pawMat = breed.pattern === 'siamese' ? stripeMat : bellyMat;
  [
    [-0.18, 0.12, 0.24],
    [0.18, 0.12, 0.24],
    [-0.18, 0.12, -0.22],
    [0.18, 0.12, -0.22]
  ].forEach(([px, py, pz]) => {
    const paw = new THREE.Mesh(pawGeo, pawMat);
    paw.position.set(px, py, pz);
    bodyPivot.add(paw);
  });

  // Tail (wagging pivot!)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.5, -0.36);
  const tailMesh = addShadow(
    new THREE.Mesh(
      getSharedGeo('catTail', () => new THREE.CapsuleGeometry(0.085, 0.42, 5, 8)),
      breed.pattern === 'siamese' ? stripeMat : bodyMat
    )
  );
  tailMesh.scale.set(fluff * 0.9, 1, fluff * 0.9);
  tailMesh.rotation.x = -0.65;
  tailMesh.position.set(0, 0.22, -0.16);
  tailPivot.add(tailMesh);
  bodyPivot.add(tailPivot);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82, 0.34);
  const head = addShadow(
    new THREE.Mesh(
      getSharedGeo('catHead', () => new THREE.SphereGeometry(0.34, 16, 14)),
      bodyMat
    )
  );
  head.scale.set(1.06, 0.96, 0.96);
  headGroup.add(head);

  // Siamese dark mask
  if (breed.pattern === 'siamese') {
    const mask = new THREE.Mesh(
      getSharedGeo('siameseMask', () => new THREE.SphereGeometry(0.22, 12, 10)),
      stripeMat
    );
    mask.position.set(0, -0.02, 0.18);
    mask.scale.set(1.1, 0.85, 0.7);
    headGroup.add(mask);
  }

  // Ears
  const earGeo = getSharedGeo('catEar', () => new THREE.ConeGeometry(0.14, 0.26, 4));
  const innerEarGeo = getSharedGeo('catInnerEar', () => new THREE.ConeGeometry(0.075, 0.16, 4));
  const innerEarMat = makeMat(0xff8fab, { roughness: 0.6 });
  const earMat = breed.pattern === 'siamese' ? stripeMat : bodyMat;

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(earGeo, earMat);
    ear.position.set(side * 0.2, 0.3, 0.02);
    ear.rotation.z = -side * 0.28;
    ear.rotation.y = Math.PI / 4;
    const inner = new THREE.Mesh(innerEarGeo, innerEarMat);
    inner.position.set(side * 0.2, 0.28, 0.055);
    inner.rotation.z = -side * 0.28;
    inner.rotation.y = Math.PI / 4;
    headGroup.add(ear, inner);
  });

  // Eyes (Supports Van Kedisi heterochromia!)
  const eyeGeo = getSharedGeo('catEye', () => new THREE.SphereGeometry(0.068, 10, 10));
  const pupilGeo = getSharedGeo('catPupil', () => new THREE.SphereGeometry(0.036, 8, 8));
  const pupilMat = makeMat(0x0f172a, { roughness: 0.1 });

  const lEye = new THREE.Mesh(
    eyeGeo,
    makeMat(breed.eyeColors[0], { emissive: breed.eyeColors[0], emissiveIntensity: 0.18 })
  );
  lEye.position.set(-0.13, 0.03, 0.29);
  const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
  lPupil.position.set(-0.13, 0.03, 0.335);

  const rEye = new THREE.Mesh(
    eyeGeo,
    makeMat(breed.eyeColors[1], { emissive: breed.eyeColors[1], emissiveIntensity: 0.18 })
  );
  rEye.position.set(0.13, 0.03, 0.29);
  const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
  rPupil.position.set(0.13, 0.03, 0.335);

  headGroup.add(lEye, lPupil, rEye, rPupil);

  // Cute pink nose
  const nose = new THREE.Mesh(
    getSharedGeo('catNose', () => new THREE.SphereGeometry(0.045, 8, 8)),
    makeMat(0xf43f5e, { roughness: 0.4 })
  );
  nose.position.set(0, -0.05, 0.33);
  headGroup.add(nose);

  // Bespoke 3D Accessories per breed!
  switch (breed.accessory) {
    case 'nazar': {
      const am = createNazarAmulet(0.45);
      am.position.set(0, -0.26, 0.28);
      headGroup.add(am);
      break;
    }
    case 'bowtie': {
      const tieMat = makeMat(0xe63946);
      const wingGeo = getSharedGeo('bowWing', () => new THREE.ConeGeometry(0.1, 0.16, 6));
      const wL = new THREE.Mesh(wingGeo, tieMat);
      wL.rotation.z = -Math.PI / 2;
      wL.position.set(-0.08, -0.28, 0.26);
      const wR = new THREE.Mesh(wingGeo, tieMat);
      wR.rotation.z = Math.PI / 2;
      wR.position.set(0.08, -0.28, 0.26);
      headGroup.add(wL, wR);
      break;
    }
    case 'fes': {
      const fes = new THREE.Mesh(
        getSharedGeo('catFes', () => new THREE.CylinderGeometry(0.15, 0.19, 0.2, 14)),
        makeMat(0x991b1b, { roughness: 0.5 })
      );
      fes.position.set(0, 0.36, 0);
      const tassel = new THREE.Mesh(
        getSharedGeo('fesTassel', () => new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6)),
        makeMat(0x111827)
      );
      tassel.position.set(0.15, 0.36, 0);
      tassel.rotation.z = -0.35;
      headGroup.add(fes, tassel);
      break;
    }
    case 'sunglasses': {
      const lensMat = makeMat(0x0f172a, { roughness: 0.1, metalness: 0.6 });
      const rimMat = makeMat(0xffffff);
      const lensGeo = getSharedGeo('glassLens', () => new THREE.BoxGeometry(0.14, 0.09, 0.05));
      const lL = new THREE.Mesh(lensGeo, lensMat);
      lL.position.set(-0.13, 0.04, 0.34);
      const lR = new THREE.Mesh(lensGeo, lensMat);
      lR.position.set(0.13, 0.04, 0.34);
      const bridge = new THREE.Mesh(
        getSharedGeo('glassBridge', () => new THREE.BoxGeometry(0.12, 0.03, 0.04)),
        rimMat
      );
      bridge.position.set(0, 0.06, 0.34);
      headGroup.add(lL, lR, bridge);
      break;
    }
    case 'eyepatch': {
      const patch = new THREE.Mesh(
        getSharedGeo('eyepatch', () => new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12)),
        makeMat(0x111827)
      );
      patch.rotation.x = Math.PI / 2;
      patch.position.set(-0.13, 0.04, 0.34);
      headGroup.add(patch);
      break;
    }
    case 'scarf_tokat':
    case 'scarf_artvin': {
      const scarfCol = breed.accessory === 'scarf_tokat' ? 0xe11d48 : 0x059669;
      const scarf = new THREE.Mesh(
        getSharedGeo('catScarf', () => new THREE.TorusGeometry(0.25, 0.065, 8, 16)),
        makeMat(scarfCol, { roughness: 0.7 })
      );
      scarf.rotation.x = Math.PI / 2;
      scarf.position.set(0, -0.24, -0.02);
      headGroup.add(scarf);
      break;
    }
    case 'tea_hat': {
      const saucer = new THREE.Mesh(
        getSharedGeo('teaSaucer', () => new THREE.CylinderGeometry(0.16, 0.1, 0.04, 12)),
        makeMat(0xffffff)
      );
      saucer.position.set(0, 0.33, 0);
      const glass = new THREE.Mesh(
        getSharedGeo('teaGlass', () => new THREE.CylinderGeometry(0.09, 0.07, 0.18, 12)),
        makeMat(0xb45309, { roughness: 0.15, emissive: 0x7c2d12, emissiveIntensity: 0.25 })
      );
      glass.position.set(0, 0.43, 0);
      headGroup.add(saucer, glass);
      break;
    }
    case 'crown': {
      const crown = new THREE.Mesh(
        getSharedGeo('catCrown', () => new THREE.ConeGeometry(0.15, 0.2, 5)),
        makeMat(0xfbbf24, { metalness: 0.6, roughness: 0.2, emissive: 0xd97706, emissiveIntensity: 0.3 })
      );
      crown.position.set(0, 0.4, 0);
      headGroup.add(crown);
      break;
    }
    case 'simit_cushion': {
      const simit = new THREE.Mesh(
        getSharedGeo('tombiliSimit', () => new THREE.TorusGeometry(0.38, 0.1, 8, 18)),
        makeMat(0xd97706, { roughness: 0.65 })
      );
      simit.rotation.x = Math.PI / 2;
      simit.position.set(0, 0.16, 0);
      bodyPivot.add(simit);
      break;
    }
  }

  bodyPivot.add(headGroup);

  root.userData = {
    breed,
    bodyPivot,
    headGroup,
    tailPivot,
    pickupRing,
    phase: Math.random() * Math.PI * 2
  };
  return root;
}

export function createPowerupMesh(type) {
  const root = new THREE.Group();

  const haloColor =
    type === 'nazar' ? 0x38bdf8 : type === 'tea' ? 0xf97316 : type === 'milk' ? 0xfef08a : 0xfbbf24;

  const halo = new THREE.Mesh(
    getSharedGeo('powHalo', () => new THREE.RingGeometry(0.6, 0.9, 24)),
    new THREE.MeshBasicMaterial({
      color: haloColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.04;
  root.add(halo);

  const item = new THREE.Group();
  item.position.y = 0.72;

  if (type === 'simit') {
    const torus = addShadow(
      new THREE.Mesh(
        getSharedGeo('powSimit', () => new THREE.TorusGeometry(0.38, 0.14, 12, 24)),
        makeMat(0xd97706, { roughness: 0.5, emissive: 0x92400e, emissiveIntensity: 0.25 })
      )
    );
    torus.rotation.x = 0.45;
    item.add(torus);
  } else if (type === 'tea') {
    // Turkish ince belli tea on classic red-white saucer
    const saucer = addShadow(
      new THREE.Mesh(
        getSharedGeo('powSaucer', () => new THREE.CylinderGeometry(0.42, 0.26, 0.08, 18)),
        makeMat(0xffffff, { roughness: 0.2 })
      )
    );
    saucer.position.y = -0.2;
    const redRing = new THREE.Mesh(
      getSharedGeo('powRedRing', () => new THREE.TorusGeometry(0.33, 0.035, 8, 18)),
      makeMat(0xe63946)
    );
    redRing.rotation.x = Math.PI / 2;
    redRing.position.y = -0.17;
    const glass = addShadow(
      new THREE.Mesh(
        getSharedGeo('powTeaGlass', () => new THREE.CylinderGeometry(0.19, 0.14, 0.46, 16)),
        makeMat(0xb91c1c, { roughness: 0.15, emissive: 0x991b1b, emissiveIntensity: 0.35 })
      )
    );
    glass.position.y = 0.05;
    item.add(saucer, redRing, glass);
  } else if (type === 'nazar') {
    const am = createNazarAmulet(1.45);
    item.add(am);
  } else {
    // Milk bowl (2x points)
    const bowl = addShadow(
      new THREE.Mesh(
        getSharedGeo('powBowl', () => new THREE.CylinderGeometry(0.42, 0.28, 0.26, 18)),
        makeMat(0x06b6d4, { roughness: 0.25 })
      )
    );
    const milk = new THREE.Mesh(
      getSharedGeo('powMilk', () => new THREE.CylinderGeometry(0.36, 0.36, 0.04, 18)),
      makeMat(0xffffff, { emissive: 0xfef9c3, emissiveIntensity: 0.35 })
    );
    milk.position.y = 0.12;
    item.add(bowl, milk);
  }

  root.add(item);
  root.userData = { type, item, halo };
  return root;
}
