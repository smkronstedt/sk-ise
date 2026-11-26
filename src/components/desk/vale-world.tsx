import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { topics } from "@/lib/desk/topics";

type Place = {
  id: string;
  name: string;
  realm: string;
  x: number;
  z: number;
  tint: number;
  kind: "meadow" | "canyon" | "mesa" | "lock" | "court" | "keep" | "wood" | "citadel";
};

/** Original overworld. The shape is an adventure field, not a Nintendo map. */
export const valePlaces: Place[] = [
  { id: "basic", name: "Willow Meadow", realm: "Home field", x: 0, z: 38, tint: 0x7dce6a, kind: "meadow" },
  { id: "core", name: "Red Canyon", realm: "Canyon temple", x: -52, z: 4, tint: 0xc45c4a, kind: "canyon" },
  { id: "stones", name: "Amber Mesa", realm: "Mountain folk", x: 54, z: 2, tint: 0xe0b15a, kind: "mesa" },
  { id: "obstruction", name: "Lockwater", realm: "River domain", x: 26, z: 36, tint: 0x3aa0b8, kind: "lock" },
  { id: "urogyn", name: "Marble Court", realm: "White temple", x: -30, z: 44, tint: 0xf2efe6, kind: "court" },
  { id: "andrology", name: "High Keep", realm: "The castle", x: 6, z: -46, tint: 0xd7a24a, kind: "keep" },
  { id: "peds", name: "Fernwood", realm: "Deep wood", x: -46, z: -30, tint: 0x2f7a46, kind: "wood" },
  { id: "oncology", name: "Ash Citadel", realm: "Ash temple", x: 48, z: -38, tint: 0x6a5a78, kind: "citadel" },
];

const SPAN = 108;

type Hour = "dawn" | "day" | "dusk" | "night";
type Weather = "clear" | "rain";

const HOURS: { id: Hour; label: string }[] = [
  { id: "dawn", label: "Dawn" },
  { id: "day", label: "Day" },
  { id: "dusk", label: "Dusk" },
  { id: "night", label: "Night" },
];

const GEM_Y: Record<Place["kind"], number> = {
  meadow: 4.4,
  canyon: 6.6,
  mesa: 5.4,
  lock: 5.8,
  court: 4.6,
  keep: 11.4,
  wood: 7.6,
  citadel: 7.2,
};

const PRESET: Record<Hour, { zenith: string; mid: string; horizon: string; fog: string; sun: string; sunI: number; hemi: number; exp: number; cloud: number }> = {
  dawn: { zenith: "#6d88c4", mid: "#f0a07a", horizon: "#ffc2a0", fog: "#f0b89a", sun: "#ffb070", sunI: 1.15, hemi: 0.48, exp: 1.05, cloud: 0.35 },
  day: { zenith: "#3d7ee0", mid: "#8ec8f2", horizon: "#d7ecfb", fog: "#b9d6f0", sun: "#fff6e4", sunI: 1.85, hemi: 0.72, exp: 1.12, cloud: 0.55 },
  dusk: { zenith: "#3a3568", mid: "#d26a4a", horizon: "#ffb07a", fog: "#c47a62", sun: "#ff8844", sunI: 0.95, hemi: 0.38, exp: 1.02, cloud: 0.4 },
  night: { zenith: "#070b18", mid: "#141c36", horizon: "#24304e", fog: "#10182c", sun: "#b9c8ff", sunI: 0.28, hemi: 0.16, exp: 0.72, cloud: 0.08 },
};

function riverDist(x: number, z: number) {
  const knots = [
    [40, 50],
    [30, 34],
    [16, 18],
    [6, 11],
  ];
  let best = 99;
  for (let i = 0; i < knots.length - 1; i += 1) {
    const ax = knots[i][0];
    const az = knots[i][1];
    const bx = knots[i + 1][0];
    const bz = knots[i + 1][1];
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / len2));
    const d = Math.hypot(x - (ax + abx * t), z - (az + abz * t));
    if (d < best) best = d;
  }
  return best;
}

function onBridge(x: number, z: number) {
  const dx = x - 23;
  const dz = z - 26;
  const along = dx * -0.66 + dz * -0.75;
  const across = dx * 0.75 + dz * -0.66;
  return Math.abs(along) < 1.45 && Math.abs(across) < 3.3;
}

function heightAt(x: number, z: number) {
  const meadow = Math.sin(x * 0.045) * Math.cos(z * 0.04) * 1.35;
  const roll = Math.sin(x * 0.015 + 0.6) * Math.cos(z * 0.019) * 2.4;
  const keep = Math.exp(-((x - 6) ** 2 + (z + 46) ** 2) / 280) * 18;
  const canyon = Math.exp(-((x + 52) ** 2) / 420) * Math.exp(-(z * z) / 1600) * -7.2;
  const mesa = Math.exp(-((x - 54) ** 2 + (z - 2) ** 2) / 520) * 9.5;
  const woods = x < -18 && z < -8 ? Math.sin(x * 0.09) * Math.sin(z * 0.08) * 2.1 + 1.2 : 0;
  const citadel = Math.exp(-((x - 48) ** 2 + (z + 38) ** 2) / 380) * 4.5;
  const rim = Math.max(0, Math.hypot(x, z) - 78) * 0.72;
  let h = meadow + roll + keep + canyon + mesa + woods + citadel + rim;
  const lake = Math.hypot(x - 42, z - 52);
  if (lake < 16) h = Math.min(h, -1.7 + lake * 0.015);
  const rd = riverDist(x, z);
  if (rd < 3.6 && lake > 15) {
    const k = 1 - rd / 3.6;
    h = Math.min(h, -0.15 - k * 0.7);
  }
  if (onBridge(x, z)) h = Math.max(h, 0.72);
  return h;
}

function pathDist(x: number, z: number) {
  const knots = [
    [0, 38],
    [0, 8],
    [-52, 4],
    [0, 8],
    [54, 2],
    [0, 8],
    [26, 36],
    [0, 8],
    [-30, 44],
    [0, 8],
    [6, -46],
    [0, 8],
    [-46, -30],
    [0, 8],
    [48, -38],
  ];
  let best = 99;
  for (let i = 0; i < knots.length - 1; i += 1) {
    const ax = knots[i][0];
    const az = knots[i][1];
    const bx = knots[i + 1][0];
    const bz = knots[i + 1][1];
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / len2));
    const d = Math.hypot(x - (ax + abx * t), z - (az + abz * t));
    if (d < best) best = d;
  }
  return best;
}

function slopeAt(x: number, z: number) {
  const e = 1.35;
  const hx = heightAt(x + e, z) - heightAt(x - e, z);
  const hz = heightAt(x, z + e) - heightAt(x, z - e);
  return Math.hypot(hx, hz) / (e * 2);
}

const tint = new THREE.Color();

function groundColor(x: number, z: number, h: number, fast = false) {
  const lake = Math.hypot(x - 42, z - 52);
  const slope = fast ? 0 : slopeAt(x, z);
  const patch = Math.sin(x * 0.07 + 1.2) * Math.cos(z * 0.055) * 0.5 + Math.sin(x * 0.21) * Math.cos(z * 0.17) * 0.25;
  if (lake < 17.5 && h < 0.35) tint.set("#e6d3a6");
  else if (x > 30 && h > 4) tint.set(h > 7.2 ? "#e4c48a" : "#d2a15a");
  else if (x < -30 && h < 1.2) tint.set(h < -1 ? "#9a342c" : "#c46248");
  else if (h > 11) tint.set("#9aa4a8");
  else if (x < -16 && z < -8) tint.set(patch > 0 ? "#1f6a38" : "#174e2c");
  else if (Math.hypot(x - 6, z + 46) < 18 && h > 6) tint.set("#7d8478");
  else tint.set(patch > 0.18 ? "#73c84e" : patch < -0.18 ? "#3e9a3a" : "#58b244");
  if (!fast && slope > 0.42 && h > -1) {
    const rock = h > 8 ? "#8e98a0" : x < -20 ? "#a85040" : "#8a8178";
    tint.lerp(new THREE.Color(rock), Math.min(1, (slope - 0.42) * 2.2));
    if (slope > 0.62) tint.multiplyScalar(Math.sin(h * 3.2 + x * 0.04) > 0 ? 1.08 : 0.88);
  }
  const pd = pathDist(x, z);
  if (pd < 3.3 && h < 9 && slope < 0.55) {
    const worn = pd < 1.15 ? "#e0c48e" : "#c4a06a";
    tint.lerp(new THREE.Color(worn), (1 - pd / 3.3) ** 1.4);
  }
  if (lake > 12 && lake < 18 && h < 1.2) tint.lerp(new THREE.Color("#ead7a8"), Math.max(0, 1 - (lake - 12) / 5));
  if (!fast) {
    const nbr = (heightAt(x + 2.4, z) + heightAt(x - 2.4, z) + heightAt(x, z + 2.4) + heightAt(x, z - 2.4)) / 4 - h;
    tint.multiplyScalar(THREE.MathUtils.clamp(1 - nbr * 0.12, 0.78, 1.06));
  }
  tint.r = THREE.MathUtils.clamp(tint.r, 0, 1);
  tint.g = THREE.MathUtils.clamp(tint.g, 0, 1);
  tint.b = THREE.MathUtils.clamp(tint.b, 0, 1);
  return tint;
}

function makeTerrain() {
  const seg = 168;
  const geo = new THREE.PlaneGeometry(SPAN * 2, SPAN * 2, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    const c = groundColor(x, z, h);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    uv.setXY(i, x / 4.2, z / 4.2);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: detailAlbedo(),
    normalMap: detailNormal(),
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.88,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
}

function makeTexture(paint: (ctx: CanvasRenderingContext2D, s: number) => void, size = 128, color = true) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = color ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function detailAlbedo() {
  return makeTexture((ctx, s) => {
    ctx.fillStyle = "#f3f1ec";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2200; i += 1) {
      const g = 214 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${g},${g - 4},${g - 10})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 2 + Math.random() * 4);
    }
    for (let i = 0; i < 80; i += 1) {
      ctx.fillStyle = `rgba(90,80,60,${0.08 + Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 4 + Math.random() * 8, 2, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 256);
}

function detailNormal() {
  const s = 128;
  const h = new Float32Array(s * s);
  for (let y = 0; y < s; y += 1) {
    for (let x = 0; x < s; x += 1) {
      const n =
        Math.sin(x * 0.55) * Math.cos(y * 0.48) * 0.55 +
        Math.sin(x * 1.7 + y * 0.4) * 0.25 +
        Math.sin((x + y) * 3.1) * 0.12;
      h[y * s + x] = n;
    }
  }
  return makeTexture((ctx, size) => {
    const img = ctx.createImageData(size, size);
    const sample = (x: number, y: number) => h[((y + s) % s) * s + ((x + s) % s)];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = sample(x + 1, y) - sample(x - 1, y);
        const dy = sample(x, y + 1) - sample(x, y - 1);
        const nx = -dx * 2.2;
        const ny = -dy * 2.2;
        const nz = 1;
        const inv = 1 / Math.hypot(nx, ny, nz);
        const i = (y * size + x) * 4;
        img.data[i] = (nx * inv * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
        img.data[i + 2] = (nz * inv * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, s, false);
}

function paintTerrain(canvas: HTMLCanvasElement, parchment: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.createImageData(w, h);
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const x = (px / w) * SPAN * 2 - SPAN;
      const z = (py / h) * SPAN * 2 - SPAN;
      const hh = heightAt(x, z);
      const col = groundColor(x, z, hh, true);
      const shade = 0.78 + Math.min(0.28, Math.max(0, hh) / 28);
      const i = (py * w + px) * 4;
      let r = col.r * 255 * shade;
      let g = col.g * 255 * shade;
      let b = col.b * 255 * shade;
      if (parchment) {
        r = r * 0.72 + 86;
        g = g * 0.66 + 62;
        b = b * 0.45 + 28;
      }
      img.data[i] = Math.min(255, r);
      img.data[i + 1] = Math.min(255, g);
      img.data[i + 2] = Math.min(255, b);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  if (!parchment) return;
  ctx.strokeStyle = "rgba(92, 58, 24, 0.85)";
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.strokeStyle = "rgba(196, 154, 78, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.fillStyle = "rgba(62, 40, 18, 0.88)";
  ctx.font = "700 18px Georgia, serif";
  ctx.fillText("The Vale", 22, 36);
  ctx.font = "12px Georgia, serif";
  ctx.fillText("N", w / 2 - 4, 32);
}

function bark() {
  return makeTexture((ctx, s) => {
    ctx.fillStyle = "#6b4426";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? "#4a2e16" : "#7a5230";
      ctx.fillRect(0, y, s, 2);
    }
    ctx.strokeStyle = "#3a2412";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo((i * s) / 6, 0);
      ctx.bezierCurveTo((i * s) / 6 + 8, s * 0.3, (i * s) / 6 - 6, s * 0.7, (i * s) / 6 + 4, s);
      ctx.stroke();
    }
  });
}

function leafTex(hex: string) {
  return makeTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(s * 0.38, s * 0.34, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.arc(s * 0.62, s * 0.6, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  });
}

function grassTex() {
  return makeTexture((ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    for (let i = 0; i < 7; i += 1) {
      const x = s * (0.18 + i * 0.1);
      ctx.strokeStyle = i % 2 ? "#3e9a34" : "#8ed45a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, s);
      ctx.quadraticCurveTo(x + (i - 3) * 4, s * 0.45, x + (i - 3) * 7, s * 0.08);
      ctx.stroke();
    }
  }, 128);
}

function hash01(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function scatterTrees(root: THREE.Object3D) {
  const trunks: THREE.Matrix4[] = [];
  const rounds: THREE.Matrix4[] = [];
  const pines: THREE.Matrix4[] = [];
  const roundCol: THREE.Color[] = [];
  const pineCol: THREE.Color[] = [];
  const dummy = new THREE.Object3D();
  const placeTree = (i: number, px: number, pz: number, pine: boolean, scale: number) => {
    const h = heightAt(px, pz);
    if (h < 0.15 || h > 13) return;
    dummy.position.set(px, h, pz);
    dummy.rotation.set(0, i * 0.7, 0);
    dummy.scale.set(scale, scale * (pine ? 1.35 : 1), scale);
    dummy.updateMatrix();
    trunks.push(dummy.matrix.clone());
    dummy.position.y = h + (pine ? 2.4 : 1.7) * scale;
    dummy.scale.set(scale * (pine ? 1.15 : 1.7), scale * (pine ? 1.8 : 1.25), scale * (pine ? 1.15 : 1.7));
    dummy.updateMatrix();
    const col = new THREE.Color(pine ? (i % 2 ? "#1d6a32" : "#246e38") : i % 3 === 0 ? "#3f9a40" : "#2f8a38");
    if (pine) {
      pines.push(dummy.matrix.clone());
      pineCol.push(col);
    } else {
      rounds.push(dummy.matrix.clone());
      roundCol.push(col);
    }
  };
  for (let i = 0; i < 520; i += 1) {
    const px = hash01(i, 1) * SPAN * 2 - SPAN;
    const pz = hash01(i, 2) * SPAN * 2 - SPAN;
    if (Math.hypot(px, pz) > 94) continue;
    if (pathDist(px, pz) < 3.4) continue;
    if (Math.hypot(px - 42, pz - 52) < 17) continue;
    let crowded = false;
    for (const place of valePlaces) {
      if (Math.hypot(px - place.x, pz - place.z) < 6) crowded = true;
    }
    if (crowded) continue;
    const field = Math.hypot(px, pz - 16) < 32;
    const woods = px < -18 && pz < -4;
    const canyon = px < -34 && Math.abs(pz) < 22;
    if (canyon) continue;
    if (field && hash01(i, 3) > 0.18) continue;
    if (!woods && !field && hash01(i, 4) > 0.55) continue;
    const pine = woods || heightAt(px, pz) > 5 || hash01(i, 5) > 0.72;
    placeTree(i, px, pz, pine, 0.7 + hash01(i, 6) * 0.7);
  }
  for (let i = 0; i < 180; i += 1) {
    const px = -20 - hash01(i, 7) * 70;
    const pz = -6 - hash01(i, 8) * 70;
    if (pathDist(px, pz) < 3) continue;
    placeTree(1000 + i, px, pz, true, 0.85 + hash01(i, 9) * 0.55);
  }
  if (!trunks.length) return;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.7, 6);
  trunkGeo.translate(0, 0.85, 0);
  const roundGeo = new THREE.IcosahedronGeometry(0.9, 1);
  const pineGeo = new THREE.ConeGeometry(0.85, 2.2, 7);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ map: bark(), roughness: 0.92 }), trunks.length);
  const roundMesh = new THREE.InstancedMesh(
    roundGeo,
    new THREE.MeshStandardMaterial({ map: leafTex("#3d9a44"), roughness: 0.72, color: "#ffffff" }),
    Math.max(rounds.length, 1),
  );
  const pineMesh = new THREE.InstancedMesh(
    pineGeo,
    new THREE.MeshStandardMaterial({ color: "#2c7a3a", roughness: 0.78 }),
    Math.max(pines.length, 1),
  );
  trunks.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
  rounds.forEach((m, i) => {
    roundMesh.setMatrixAt(i, m);
    roundMesh.setColorAt(i, roundCol[i]);
  });
  pines.forEach((m, i) => {
    pineMesh.setMatrixAt(i, m);
    pineMesh.setColorAt(i, pineCol[i]);
  });
  roundMesh.count = rounds.length;
  pineMesh.count = pines.length;
  roundMesh.instanceColor && (roundMesh.instanceColor.needsUpdate = true);
  pineMesh.instanceColor && (pineMesh.instanceColor.needsUpdate = true);
  for (const mesh of [trunkMesh, roundMesh, pineMesh]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
  }
  root.add(trunkMesh, roundMesh, pineMesh);
}

function addGrass(root: THREE.Object3D) {
  const geo = mergeGeometries([
    new THREE.PlaneGeometry(0.62, 0.9, 1, 3).translate(0, 0.45, 0),
    new THREE.PlaneGeometry(0.62, 0.9, 1, 3).translate(0, 0.45, 0).rotateY(Math.PI / 2),
  ]);
  if (!geo) return null;
  const mat = new THREE.MeshStandardMaterial({
    map: grassTex(),
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.8,
    color: "#8ed25a",
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         transformed.x += sin(uTime * 1.7 + position.z * 0.8 + position.x) * 0.12 * position.y;
         transformed.z += cos(uTime * 1.3 + position.x) * 0.06 * position.y;`,
      );
    mat.userData.shader = shader;
  };
  const mesh = new THREE.InstancedMesh(geo, mat, 900);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < 1400 && n < 900; i += 1) {
    const px = hash01(i, 11) * SPAN * 2 - SPAN;
    const pz = hash01(i, 12) * SPAN * 2 - SPAN;
    if (Math.hypot(px, pz) > 90) continue;
    if (pathDist(px, pz) < 2.6) continue;
    if (Math.hypot(px - 42, pz - 52) < 15) continue;
    if (slopeAt(px, pz) > 0.55) continue;
    const h = heightAt(px, pz);
    if (h < 0.2 || h > 8) continue;
    const field = Math.hypot(px, pz - 14) < 40;
    if (!field && hash01(i, 13) > 0.45) continue;
    dummy.position.set(px, h, pz);
    dummy.rotation.y = hash01(i, 14) * Math.PI;
    const s = 0.7 + hash01(i, 15) * 0.8;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(n, dummy.matrix);
    n += 1;
  }
  mesh.count = n;
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mat;
}

function addRocks(root: THREE.Object3D) {
  const geo = new THREE.DodecahedronGeometry(0.85, 0);
  const mat = new THREE.MeshStandardMaterial({ color: "#8d877e", roughness: 0.94 });
  const mesh = new THREE.InstancedMesh(geo, mat, 90);
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < 90; i += 1) {
    const px = Math.sin(i * 2.17) * (40 + (i % 7) * 8);
    const pz = Math.cos(i * 1.63) * (36 + (i % 5) * 9);
    if (pathDist(px, pz) < 2.8) continue;
    if (Math.hypot(px - 42, pz - 52) < 16) continue;
    const h = heightAt(px, pz);
    if (h < 0.2) continue;
    dummy.position.set(px, h + 0.2, pz);
    dummy.rotation.set(i * 0.4, i * 0.8, i * 0.2);
    const s = 0.45 + (i % 6) * 0.22;
    dummy.scale.set(s * 1.3, s * 0.65, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(n, dummy.matrix);
    n += 1;
  }
  mesh.count = n;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  root.add(mesh);
}

function addHorizon(root: THREE.Object3D) {
  const hill = new THREE.MeshStandardMaterial({ color: "#66785a", roughness: 1 });
  const snow = new THREE.MeshStandardMaterial({ color: "#e7eef4", roughness: 0.55 });
  const rust = new THREE.MeshStandardMaterial({ color: "#8d4638", roughness: 0.9 });
  for (let i = 0; i < 20; i += 1) {
    const a = (i / 20) * Math.PI * 2 + 0.2;
    const r = 118 + (i % 3) * 5;
    const tall = 16 + (i % 5) * 7;
    const west = Math.cos(a) < -0.45;
    const mat = west && i % 2 === 0 ? rust : hill;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(7 + (i % 4) * 2.2, tall, 6), mat);
    cone.position.set(Math.cos(a) * r, tall * 0.28, Math.sin(a) * r);
    cone.castShadow = false;
    cone.receiveShadow = true;
    if (i % 4 === 0) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(3.1, 4.2, 5), snow);
      cap.position.y = tall * 0.42;
      cone.add(cap);
    }
    root.add(cone);
  }
}

function std(color: string | number, roughness = 0.75, emissive?: string) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
    emissive: emissive ?? "#000",
    emissiveIntensity: emissive ? 0.7 : 0,
  });
}

function house(parent: THREE.Object3D, x: number, z: number, rot: number) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.7), std("#f3ead8", 0.86));
  wall.position.y = 0.8;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.15, 4), std("#8d342c", 0.62));
  roof.position.y = 2.05;
  roof.rotation.y = Math.PI / 4;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.08), std("#5c3a22", 0.8));
  door.position.set(0, 0.42, 0.88);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.06), std("#f2e2a8", 0.3, "#ffd27a"));
  win.position.set(0.7, 0.95, 0.86);
  win.name = "lamp";
  g.add(wall, roof, door, win);
  g.position.set(x, heightAt(x, z), z);
  g.rotation.y = rot;
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  parent.add(g);
}

function landmark(kind: Place["kind"], tintHex: number) {
  const g = new THREE.Group();
  const stone = std(tintHex, 0.72);
  const dark = std("#3a342c", 0.82);
  const wood = std("#6b4324", 0.8);
  if (kind === "meadow") {
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.4, 6), stone);
      col.position.set(Math.cos(a) * 2.1, 1.2, Math.sin(a) * 2.1);
      g.add(col);
    }
    const lip = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 6, 16), dark);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.35;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.18, 16), std("#7ec8e8", 0.2, "#9ad8f0"));
    bowl.position.y = 0.4;
    g.add(lip, bowl);
  } else if (kind === "canyon") {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 5.4, 2.4), stone);
    const r = l.clone();
    l.position.set(-2.1, 2.6, 0);
    r.position.set(2.1, 2.6, 0);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.42, 0.7), dark);
    beam.position.y = 5.1;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.3), std("#f2efe6", 0.6));
    banner.position.set(0, 4.1, 0.4);
    g.add(l, r, beam, banner);
  } else if (kind === "mesa") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 1.3, 6), stone);
    base.position.y = 0.65;
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 1.1, 6), std("#c48a3a", 0.7));
    mid.position.y = 1.7;
    const shrine = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.1), dark);
    shrine.position.y = 2.8;
    g.add(base, mid, shrine);
  } else if (kind === "lock") {
    const mill = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 3.1, 8), stone);
    mill.position.y = 1.55;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 8), std("#6a3a28", 0.65));
    roof.position.y = 3.5;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 6, 14), dark);
    wheel.position.set(1.55, 1.3, 0);
    wheel.name = "spinner";
    const axle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.7, 0.08), wood);
    axle.position.set(1.55, 1.3, 0);
    axle.name = "spinner";
    g.add(mill, roof, wheel, axle);
  } else if (kind === "court") {
    for (let i = 0; i < 6; i += 1) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 3.1, 8), stone);
      col.position.set((i % 3) * 1.5 - 1.5, 1.55, Math.floor(i / 3) * 1.8 - 0.9);
      g.add(col);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.28, 2.6), dark);
    roof.position.y = 3.2;
    roof.rotation.z = 0.08;
    g.add(roof);
  } else if (kind === "keep") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 4.4), std("#c4a36a", 0.8));
    base.position.y = 0.7;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.7, 7.2, 8), stone);
    tower.position.y = 4.2;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 4.4, 7), std("#b8924e", 0.75));
    side.position.set(2.1, 2.6, 0.4);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.85, 1.8, 8), std("#8d2f2a", 0.55));
    roof.position.y = 8.6;
    const sideRoof = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.1, 7), std("#8d2f2a", 0.55));
    sideRoof.position.set(2.1, 5.2, 0.4);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), std("#f2d15a", 0.5));
    flag.position.set(0.55, 9.5, 0);
    g.add(base, tower, side, roof, sideRoof, flag);
  } else if (kind === "wood") {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 3.6, 7), dark);
    trunk.position.y = 1.8;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.3, 1), stone);
    crown.position.y = 4.3;
    for (let i = 0; i < 3; i += 1) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), std("#e7d27a", 0.4, "#d8e38a"));
      cap.position.set(Math.cos(i * 2) * 1.4, 0.35, Math.sin(i * 2) * 1.4);
      cap.name = "lamp";
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 5), wood);
      stem.position.set(cap.position.x, 0.15, cap.position.z);
      g.add(cap, stem);
    }
    g.add(trunk, crown);
  } else {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 2.8), stone);
    wall.position.y = 1.3;
    const gate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.2), dark);
    gate.position.set(0, 0.8, 1.45);
    const spireL = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 3.4, 6), dark);
    spireL.position.set(-1.6, 3.2, 0);
    const spireR = spireL.clone();
    spireR.position.x = 1.6;
    const capL = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.3, 5), std("#2a242c", 0.5));
    capL.position.set(-1.6, 5.3, 0);
    const capR = capL.clone();
    capR.position.x = 1.6;
    const windowL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.08), std("#ffb060", 0.3, "#ff9a3c"));
    windowL.position.set(-1.6, 3.3, 0.46);
    windowL.name = "lamp";
    const windowR = windowL.clone();
    windowR.position.x = 1.6;
    windowR.name = "lamp";
    g.add(wall, gate, spireL, spireR, capL, capR, windowL, windowR);
  }
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({ color: "#f6e7a2", emissive: "#7ec8e3", emissiveIntensity: 0.85, roughness: 0.18, metalness: 0.15 }),
  );
  gem.position.y = GEM_Y[kind];
  gem.name = "gem";
  g.add(gem);
  return g;
}

function makeHero() {
  const g = new THREE.Group();
  const skin = std("#e7b894", 0.45);
  const cloth = std("#1e6a48", 0.4);
  const shirt = std("#f6f1e6", 0.48);
  const leather = std("#5a3820", 0.55);
  const gold = std("#e2b34a", 0.28);
  const hair = std("#3a2418", 0.5);
  const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.12, 4, 8), cloth);
  hips.position.y = 0.72;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.26, 4, 10), shirt);
  torso.position.y = 1.16;
  const tunic = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.18, 4, 8), cloth);
  tunic.position.set(0, 1.08, 0.02);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 12), gold);
  belt.rotation.x = Math.PI / 2;
  belt.position.y = 0.92;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), skin);
  head.position.y = 1.58;
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), hair);
  hairCap.position.y = 1.62;
  const bootL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 3, 6), leather);
  bootL.position.set(-0.1, 0.2, 0.04);
  const bootR = bootL.clone();
  bootR.position.x = 0.1;
  bootL.name = "bootL";
  bootR.name = "bootR";
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.28, 3, 6), cloth);
  armL.position.set(-0.3, 1.12, 0);
  armL.name = "armL";
  const armR = armL.clone();
  armR.position.x = 0.3;
  armR.name = "armR";
  const satchel = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), leather);
  satchel.scale.set(1, 1.1, 0.55);
  satchel.position.set(0.2, 0.98, -0.16);
  const cloak = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 3, 6), std("#174e34", 0.55));
  cloak.scale.z = 0.25;
  cloak.position.set(0, 1.08, -0.16);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), std("#f6e2a4", 0.25, "#ffc56a"));
  lantern.position.set(-0.32, 0.82, 0.12);
  lantern.name = "lamp";
  g.add(hips, torso, tunic, belt, head, hairCap, bootL, bootR, armL, armR, satchel, cloak, lantern);
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  return g;
}

function makeSteed() {
  const g = new THREE.Group();
  const coat = std("#8d4a28", 0.48);
  const flax = std("#f3e2b0", 0.5);
  const dark = std("#24160f", 0.55);
  const tack = std("#1f6b45", 0.45);
  const leather = std("#6a3a22", 0.42);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), coat);
  body.scale.set(0.82, 0.72, 1.55);
  body.position.set(0, 1.08, 0);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), coat);
  chest.position.set(0, 1.12, 0.46);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.34, 4, 8), coat);
  neck.position.set(0, 1.46, 0.66);
  neck.rotation.x = 0.75;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), coat);
  head.scale.set(0.78, 0.82, 1.45);
  head.position.set(0, 1.7, 0.92);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), std("#c48a62", 0.45));
  muzzle.position.set(0, 1.62, 1.1);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 6), coat);
  earL.position.set(-0.06, 1.88, 0.84);
  const earR = earL.clone();
  earR.position.x = 0.06;
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), dark);
  eyeL.position.set(-0.07, 1.74, 1.02);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;
  g.add(body, chest, neck, head, muzzle, earL, earR, eyeL, eyeR);
  for (let i = 0; i < 6; i += 1) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 5), flax);
    tuft.position.set(0, 1.62 - i * 0.05, 0.42 + i * 0.08);
    tuft.rotation.x = 1.1;
    g.add(tuft);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.72, 6), flax);
  tail.geometry.translate(0, -0.36, 0);
  tail.position.set(0, 1.22, -0.7);
  tail.rotation.x = 0.35;
  tail.name = "tail";
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.58), tack);
  blanket.position.set(0, 1.32, -0.02);
  const saddle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), leather);
  saddle.scale.set(1.05, 0.4, 1.25);
  saddle.position.set(0, 1.4, 0);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.015, 6, 10), std("#e2b34a", 0.3));
  strap.position.set(0, 1.66, 0.98);
  strap.rotation.y = Math.PI / 2;
  g.add(tail, blanket, saddle, strap);
  for (let i = 0; i < 4; i += 1) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.38, 3, 6), dark);
    leg.geometry.translate(0, -0.26, 0);
    leg.position.set(i % 2 ? 0.16 : -0.16, 0.78, i < 2 ? 0.36 : -0.38);
    leg.name = `leg${i}`;
    g.add(leg);
  }
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  g.visible = false;
  return g;
}

function makeSpirit(color: string) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), std(color, 0.35, color));
  body.position.y = 0.7;
  body.scale.set(1, 1.2, 0.8);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), std("#1a120c", 0.3));
  eye.position.set(0.14, 0.82, 0.36);
  const eye2 = eye.clone();
  eye2.position.x = -0.14;
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 6), std("#f2d15a", 0.3, "#f2d15a"));
  horn.position.y = 1.32;
  g.add(body, eye, eye2, horn);
  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  return g;
}

function makeInterior() {
  const g = new THREE.Group();
  g.position.set(0, 120, 0);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(7.2, 28), std("#cbb892", 0.75));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const wallMat = std("#6e6256", 0.72);
  const back = new THREE.Mesh(new THREE.BoxGeometry(10.4, 4.2, 0.35), wallMat);
  back.position.set(0, 2.1, -5);
  back.name = "roomWall";
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 10.2), wallMat);
  left.position.set(-5.1, 2.1, 0);
  left.name = "roomWall";
  const right = left.clone();
  right.position.x = 5.1;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), std("#7a2e2a", 0.65));
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.03;
  const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.05, 16), std("#efe6d4", 0.45));
  altar.position.set(0, 0.52, -2.5);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), std("#d7f3ff", 0.2, "#7ec8e3"));
  gem.position.set(0, 1.35, -2.5);
  gem.name = "innerGem";
  const npc = new THREE.Group();
  npc.position.set(0, 0, -3.4);
  const robe = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.7, 6, 12), std("#24365f", 0.45));
  robe.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), std("#e7b894", 0.45));
  head.position.y = 1.78;
  npc.add(robe, head);
  for (const x of [-2.5, 2.5]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.6, 12), std("#f4efe4", 0.4));
    col.position.set(x, 1.8, -1.1);
    col.castShadow = true;
    g.add(col);
  }
  const lamp = new THREE.PointLight("#ffe1b0", 0, 18, 2);
  lamp.position.set(0, 3.5, -0.4);
  lamp.name = "roomLamp";
  g.add(floor, back, left, right, rug, altar, gem, npc, lamp);
  g.visible = false;
  return g;
}

function skyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color("#3d7ee0") },
      uMid: { value: new THREE.Color("#8ec8f2") },
      uHor: { value: new THREE.Color("#d7ecfb") },
      uTime: { value: 0 },
      uCloud: { value: 0.5 },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHor;
      uniform float uTime;
      uniform float uCloud;
      void main(){
        vec3 n = normalize(vPos);
        float h = n.y;
        vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.28, h));
        col = mix(col, uTop, smoothstep(0.18, 0.85, h));
        float w = sin(n.x * 7.0 + uTime * 0.05) * sin(n.z * 6.0 - uTime * 0.04);
        w += sin(n.x * 16.0 + n.z * 9.0) * 0.35;
        float cloud = smoothstep(0.15, 0.75, w * 0.5 + 0.5) * smoothstep(0.05, 0.35, h);
        col = mix(col, vec3(1.0), cloud * uCloud);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: { uTime: { value: 0 }, uDeep: { value: new THREE.Color("#0c4a68") }, uLite: { value: new THREE.Color("#7fd0d4") } },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      void main(){
        vUv = uv;
        vec3 p = position;
        p.z += sin(position.x * 0.45 + uTime * 1.3) * 0.08 + sin(position.y * 0.55 - uTime) * 0.05;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uDeep;
      uniform vec3 uLite;
      varying vec2 vUv;
      varying vec3 vWorld;
      void main(){
        vec3 view = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(view, vec3(0.0, 1.0, 0.0)), 0.0), 2.4);
        float rip = sin(vWorld.x * 1.7 + uTime * 1.6) * sin(vWorld.z * 1.4 - uTime * 1.2);
        vec3 col = mix(uDeep, uLite, 0.35 + 0.25 * rip);
        col = mix(col, vec3(0.75, 0.9, 0.95), fres * 0.65);
        float spark = pow(max(sin(vWorld.x * 4.0 + uTime * 2.4) * sin(vWorld.z * 3.2 - uTime * 1.8), 0.0), 16.0);
        col += spark * 0.55;
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float radial = length(vUv - 0.5) * 2.0;
        float foam = max(smoothstep(0.78, 0.98, radial), smoothstep(0.16, 0.02, edge));
        col = mix(col, vec3(0.93, 0.96, 0.94), foam * 0.75);
        gl_FragColor = vec4(col, 0.82);
      }
    `,
  });
}

function makeRiver(mat: THREE.Material) {
  const pts = [
    new THREE.Vector2(40, 50),
    new THREE.Vector2(30, 34),
    new THREE.Vector2(16, 18),
    new THREE.Vector2(6, 11),
  ];
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const half = 1.65;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dz = b.y - a.y;
    const len = Math.hypot(dx, dz) || 1;
    const px = (-dz / len) * half;
    const pz = (dx / len) * half;
    const base = positions.length / 3;
    positions.push(a.x + px, -(a.y + pz), 0, a.x - px, -(a.y - pz), 0, b.x + px, -(b.y + pz), 0, b.x - px, -(b.y - pz), 0);
    uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.08;
  mesh.renderOrder = 2;
  return mesh;
}

function makeStars() {
  const n = 280;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1) {
    const y = 0.2 + hash01(i, 21) * 0.8;
    const a = hash01(i, 22) * Math.PI * 2;
    const ring = Math.sqrt(Math.max(0.05, 1 - y * y)) * 150;
    pos[i * 3] = Math.cos(a) * ring;
    pos[i * 3 + 1] = y * 140;
    pos[i * 3 + 2] = Math.sin(a) * ring;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: "#fff6e0",
    size: 1.35,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0,
    fog: false,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

function makeClouds() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.88, fog: false, depthWrite: false });
  const drift: { obj: THREE.Object3D; a: number; r: number; y: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const puff = new THREE.Group();
    for (let k = 0; k < 4; k += 1) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(3.4 + (k % 3) * 1.6, 8, 6), mat);
      sphere.position.set((k - 1.5) * 3.6, (k % 2) * 1.1, 0);
      puff.add(sphere);
    }
    const a = (i / 8) * Math.PI * 2;
    const r = 62 + (i % 3) * 10;
    const y = 36 + (i % 4) * 3;
    puff.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    g.add(puff);
    drift.push({ obj: puff, a, r, y });
  }
  return { group: g, drift, mat };
}

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  setKeys?: (codes: string[]) => void;
  teleport?: (x: number, z: number) => void;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

export function ValeWorld({
  battleDone,
  startTopicBattle,
}: {
  battleDone: Set<string>;
  startTopicBattle: (topicId: string) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [line, setLine] = useState("Willow Meadow. Walk the paths, or open the map and travel.");
  const [hour, setHour] = useState<Hour>("day");
  const [weather, setWeather] = useState<Weather>("clear");
  const [riding, setRiding] = useState(false);
  const [dot, setDot] = useState({ x: 0, z: 30 });
  const [inside, setInside] = useState<string | null>(null);
  const [questsOpen, setQuestsOpen] = useState(false);
  const [spirit, setSpirit] = useState<string | null>(null);
  const openRef = useRef(startTopicBattle);
  openRef.current = startTopicBattle;
  const battleRef = useRef(battleDone);
  battleRef.current = battleDone;
  const mapOpenRef = useRef(false);
  mapOpenRef.current = mapOpen;
  const hourRef = useRef<Hour>("day");
  hourRef.current = hour;
  const weatherRef = useRef<Weather>("clear");
  weatherRef.current = weather;
  const ridingRef = useRef(false);
  ridingRef.current = riding;
  const insideRef = useRef<string | null>(null);
  insideRef.current = inside;

  const nextIn = (blueprintId: string) => topics.find((topic) => topic.blueprintId === blueprintId && !battleRef.current.has(topic.id));
  const cleared = (blueprintId: string) => {
    const mine = topics.filter((topic) => topic.blueprintId === blueprintId);
    return mine.length > 0 && mine.every((topic) => battleRef.current.has(topic.id));
  };

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor("#8eb8d8");
    host.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#b9d6f0", 0.0095);
    const camera = new THREE.PerspectiveCamera(52, host.clientWidth / Math.max(host.clientHeight, 1), 0.12, 520);
    const skyMat = skyMaterial();
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(200, 32, 24), skyMat));
    const stars = makeStars();
    scene.add(stars);
    const clouds = makeClouds();
    scene.add(clouds.group);

    const hemi = new THREE.HemisphereLight("#d7ecff", "#6a8a48", 0.72);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#fff6e4", 1.85);
    sun.position.set(36, 48, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 8;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    sun.shadow.bias = -0.00025;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    scene.add(sun.target);
    const rim = new THREE.DirectionalLight("#9ec4ff", 0.28);
    rim.position.set(-28, 18, -16);
    scene.add(rim);

    const terrain = makeTerrain();
    scene.add(terrain);
    const grassMat = addGrass(scene);
    scatterTrees(scene);
    addRocks(scene);
    addHorizon(scene);
    house(scene, 11, 29, 0.5);
    house(scene, -11, 27, -0.4);
    house(scene, 7, 20, 1.1);

    const waterMat = waterMaterial();
    const water = new THREE.Mesh(new THREE.CircleGeometry(16.2, 56), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(42, -0.05, 52);
    water.renderOrder = 2;
    scene.add(water);
    scene.add(makeRiver(waterMat));
    const well = new THREE.Mesh(new THREE.CircleGeometry(1.15, 20), waterMat);
    well.rotation.x = -Math.PI / 2;
    well.position.set(0, heightAt(0, 38) + 0.42, 38);
    scene.add(well);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, 6.6), std("#7a5430", 0.8));
    bridge.position.set(23, 0.84, 26);
    bridge.rotation.y = Math.atan2(0.75, -0.66);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    const railMat = std("#5c3a22", 0.75);
    for (const side of [-1.2, 1.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 6.4), railMat);
      rail.position.set(23 + side * Math.cos(bridge.rotation.y), 1.2, 26 - side * Math.sin(bridge.rotation.y));
      rail.rotation.y = bridge.rotation.y;
      rail.castShadow = true;
      scene.add(rail);
    }

    const marks = new Map<string, THREE.Object3D>();
    const spinners: THREE.Object3D[] = [];
    const lampMats: THREE.MeshStandardMaterial[] = [];
    for (const place of valePlaces) {
      const mark = landmark(place.kind, place.tint);
      mark.position.set(place.x, heightAt(place.x, place.z), place.z);
      scene.add(mark);
      marks.set(place.id, mark);
    }
    scene.traverse((obj) => {
      if (obj.name === "spinner") spinners.push(obj);
      if (obj.name === "lamp" && obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) lampMats.push(obj.material);
    });

    const hero = makeHero();
    scene.add(hero);
    const steed = makeSteed();
    scene.add(steed);
    const interior = makeInterior();
    scene.add(interior);
    const spiritSpots = [
      { id: "basic", x: 14, z: 18, color: "#6fbf5c" },
      { id: "core", x: -30, z: 14, color: "#c45c4a" },
      { id: "stones", x: 34, z: -14, color: "#e0b15a" },
      { id: "peds", x: -22, z: -14, color: "#2f7a46" },
    ];
    const spirits = spiritSpots.map((spot) => {
      const mesh = makeSpirit(spot.color);
      mesh.position.set(spot.x, heightAt(spot.x, spot.z), spot.z);
      scene.add(mesh);
      return { ...spot, mesh };
    });
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.68, 24),
      new THREE.MeshBasicMaterial({ color: "#f2d15a", side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    scene.add(marker);
    const lamp = new THREE.PointLight("#ffc27a", 0, 9, 2);
    lamp.position.set(-0.3, 1.0, 0.2);
    hero.add(lamp);
    const bootL = hero.getObjectByName("bootL") as THREE.Mesh;
    const bootR = hero.getObjectByName("bootR") as THREE.Mesh;
    const armL = hero.getObjectByName("armL") as THREE.Mesh;
    const armR = hero.getObjectByName("armR") as THREE.Mesh;

    const rainCount = 420;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i += 1) {
      rainPos[i * 3] = (hash01(i, 31) - 0.5) * 36;
      rainPos[i * 3 + 1] = hash01(i, 32) * 22;
      rainPos[i * 3 + 2] = (hash01(i, 33) - 0.5) * 36;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: "#d5e4f2", size: 0.07, transparent: true, opacity: 0, depthWrite: false });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);

    let yaw = 0;
    let camYaw = 0;
    const pos = new THREE.Vector3(0, heightAt(0, 30), 30);
    let speed = 0;
    const keys = new Set<string>();
    const injected = new Set<string>();
    const held = (code: string) => keys.has(code) || injected.has(code);
    const joy = { x: 0, y: 0 };
    let lastNear: string | null = null;
    let lastSpirit: string | null = null;
    let goal: { x: number; z: number } | null = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dotMem = { x: 0, z: 30 };

    window.__controlsTest = {
      getYaw: () => yaw,
      getSpeed: () => speed,
      setKeys: (codes) => {
        injected.clear();
        for (const code of codes) injected.add(code);
      },
      teleport: (x: number, z: number) => {
        pos.x = x;
        pos.z = z;
        pos.y = heightAt(x, z);
      },
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyE", "KeyM", "KeyF"].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        if (event.code === "KeyM") setMapOpen((open) => !open);
        if (event.code === "KeyF") setRiding((on) => !on);
        if (event.code === "KeyE" || event.code === "Space") tryEnter();
      }
      keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const clearKeys = () => keys.clear();

    const nearest = () => {
      let best: Place | null = null;
      let bestD = 7.5;
      for (const place of valePlaces) {
        const d = Math.hypot(pos.x - place.x, pos.z - place.z);
        if (d < bestD) {
          best = place;
          bestD = d;
        }
      }
      return best;
    };

    const tryEnter = () => {
      if (insideRef.current) {
        const here = valePlaces.find((item) => item.id === insideRef.current);
        const topic = here ? nextIn(here.id) : undefined;
        if (!here || !topic) {
          setLine(here ? `${here.name} is clear.` : "The hall is empty.");
          return;
        }
        openRef.current(topic.id);
        return;
      }
      const place = nearest();
      if (!place) {
        if (lastSpirit) {
          const topic = nextIn(lastSpirit);
          if (topic) openRef.current(topic.id);
          else setLine("That spirit has nothing left to ask.");
        }
        return;
      }
      insideRef.current = place.id;
      setInside(place.id);
      interior.traverse((obj) => {
        if (obj.name === "roomWall" && obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
          obj.material.color.set(place.tint);
        }
      });
      setLine(`${place.name}. ${place.realm}. The keeper is waiting. Begin the questions, or step back outside.`);
    };

    let raf = 0;
    let last = performance.now();
    const clock = { t: 0 };
    const tmp = new THREE.Vector3();
    const miniCache = document.createElement("canvas");
    miniCache.width = 96;
    miniCache.height = 96;
    paintTerrain(miniCache, false);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.t += dt;
      waterMat.uniforms.uTime.value = clock.t;
      skyMat.uniforms.uTime.value = clock.t;
      const grassShader = grassMat?.userData.shader as { uniforms: { uTime: { value: number } } } | undefined;
      if (grassShader) grassShader.uniforms.uTime.value = clock.t;

      if (insideRef.current) {
        interior.visible = true;
        hero.visible = false;
        steed.visible = false;
        const here = valePlaces.find((item) => item.id === insideRef.current);
        interior.traverse((obj) => {
          if (here && obj.name === "roomWall" && obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.color.set(here.tint);
          }
        });
        const roomLamp = interior.getObjectByName("roomLamp") as THREE.PointLight | null;
        if (roomLamp) roomLamp.intensity = 1.5;
        const gem = interior.getObjectByName("innerGem") as THREE.Mesh | null;
        if (gem) {
          gem.rotation.y = clock.t * 1.4;
          gem.position.y = 1.35 + Math.sin(clock.t * 2) * 0.08;
        }
        camera.position.set(0.35, 123.15, 6.6);
        camera.lookAt(0, 122.05, -1.4);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
        return;
      }
      interior.visible = false;
      hero.visible = true;
      const roomLamp = interior.getObjectByName("roomLamp") as THREE.PointLight | null;
      if (roomLamp) roomLamp.intensity = 0;

      const look = PRESET[hourRef.current];
      const rainOn = weatherRef.current === "rain";
      const mounted = ridingRef.current;
      skyMat.uniforms.uTop.value.set(look.zenith);
      skyMat.uniforms.uMid.value.set(look.mid);
      skyMat.uniforms.uHor.value.set(look.horizon);
      skyMat.uniforms.uCloud.value = rainOn ? 0.15 : look.cloud;
      const fog = scene.fog as THREE.FogExp2;
      fog.color.set(rainOn ? "#8ea0ae" : look.fog);
      fog.density = rainOn ? 0.016 : hourRef.current === "night" ? 0.012 : 0.0085;
      sun.color.set(look.sun);
      sun.intensity = look.sunI * (rainOn ? 0.45 : 1);
      hemi.intensity = look.hemi * (rainOn ? 0.7 : 1);
      hemi.color.set(hourRef.current === "night" ? "#22304e" : "#d7ecff");
      hemi.groundColor.set(hourRef.current === "night" ? "#1a2418" : "#6a8a48");
      renderer.toneMappingExposure = look.exp * (rainOn ? 0.86 : 1);
      (stars.material as THREE.PointsMaterial).opacity = hourRef.current === "night" ? 0.95 : hourRef.current === "dusk" ? 0.28 : 0;
      clouds.mat.opacity = hourRef.current === "night" ? 0.18 : rainOn ? 0.55 : 0.88;
      clouds.mat.color.set(hourRef.current === "dusk" ? "#ffd0c0" : "#ffffff");
      for (const puff of clouds.drift) {
        const a = puff.a + clock.t * 0.012;
        puff.obj.position.set(Math.cos(a) * puff.r, puff.y, Math.sin(a) * puff.r);
      }
      const terrainMat = terrain.material as THREE.MeshStandardMaterial;
      terrainMat.roughness = rainOn ? 0.48 : 0.88;
      lamp.intensity = hourRef.current === "night" ? 1.5 : hourRef.current === "dusk" ? 0.45 : 0;
      for (const mat of lampMats) mat.emissiveIntensity = hourRef.current === "day" ? 0.15 : 0.9;

      let ix = 0;
      let iz = 0;
      if (held("KeyD") || held("ArrowRight")) ix += 1;
      if (held("KeyA") || held("ArrowLeft")) ix -= 1;
      if (held("KeyW") || held("ArrowUp")) iz += 1;
      if (held("KeyS") || held("ArrowDown")) iz -= 1;
      if (!mapOpenRef.current) {
        ix += joy.x;
        iz += joy.y;
      } else {
        ix = 0;
        iz = 0;
      }
      const mag = Math.hypot(ix, iz);
      if (mag > 1) {
        ix /= mag;
        iz /= mag;
      }
      const fx = -Math.sin(camYaw);
      const fz = -Math.cos(camYaw);
      const rx = Math.cos(camYaw);
      const rz = -Math.sin(camYaw);
      const wishX = fx * iz + rx * ix;
      const wishZ = fz * iz + rz * ix;
      const wish = Math.hypot(wishX, wishZ);
      const run = mounted ? 20 : 11;
      if (wish > 0.08 && !mapOpenRef.current) {
        goal = null;
        marker.visible = false;
        const targetYaw = Math.atan2(-wishX, -wishZ);
        let deltaYaw = targetYaw - yaw;
        while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
        while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
        yaw += deltaYaw * Math.min(1, dt * (mounted ? 6 : 10));
        pos.x += wishX * run * dt;
        pos.z += wishZ * run * dt;
        speed = run * Math.min(1, wish);
      } else if (goal && !mapOpenRef.current) {
        const dx = goal.x - pos.x;
        const dz = goal.z - pos.z;
        const distLeft = Math.hypot(dx, dz);
        if (distLeft < 0.75) {
          goal = null;
          marker.visible = false;
          speed = 0;
        } else {
          const stepX = dx / distLeft;
          const stepZ = dz / distLeft;
          const targetYaw = Math.atan2(-stepX, -stepZ);
          let deltaYaw = targetYaw - yaw;
          while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
          while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
          yaw += deltaYaw * Math.min(1, dt * (mounted ? 6 : 10));
          pos.x += stepX * run * dt;
          pos.z += stepZ * run * dt;
          speed = run;
          marker.position.y = heightAt(goal.x, goal.z) + 0.18 + Math.sin(clock.t * 5) * 0.04;
        }
      } else {
        speed = 0;
      }
      const rad = Math.hypot(pos.x, pos.z);
      if (rad > 96) {
        pos.x *= 96 / rad;
        pos.z *= 96 / rad;
      }
      const lake = Math.hypot(pos.x - 42, pos.z - 52);
      if (lake < 12) {
        const push = 12 / Math.max(lake, 0.01);
        pos.x = 42 + (pos.x - 42) * push;
        pos.z = 52 + (pos.z - 52) * push;
      }
      const ground = heightAt(pos.x, pos.z);
      pos.y = ground;
      const step = Math.sin(clock.t * (speed > 0.2 ? (mounted ? 9 : 12) : 0)) * (speed > 0.2 ? 0.4 : 0);
      hero.rotation.y = yaw + Math.PI;
      steed.rotation.y = yaw + Math.PI;
      steed.visible = mounted;
      if (mounted) {
        steed.position.set(pos.x, ground, pos.z);
        hero.position.set(pos.x, ground + 0.52, pos.z);
        if (bootL) bootL.rotation.x = 0.4;
        if (bootR) bootR.rotation.x = 0.4;
        if (armL) armL.rotation.x = 0.8;
        if (armR) armR.rotation.x = 0.8;
        for (let i = 0; i < 4; i += 1) {
          const leg = steed.getObjectByName(`leg${i}`);
          if (leg) leg.rotation.x = i % 2 === 0 ? step : -step;
        }
        const tail = steed.getObjectByName("tail");
        if (tail) tail.rotation.x = Math.sin(clock.t * 3) * 0.3;
      } else {
        hero.position.set(pos.x, ground + (speed > 0.2 ? Math.abs(Math.sin(clock.t * 12)) * 0.06 : 0), pos.z);
        if (bootL) bootL.rotation.x = step;
        if (bootR) bootR.rotation.x = -step;
        if (armL) armL.rotation.x = -step;
        if (armR) armR.rotation.x = step;
      }

      const follow = 0.04 + dt * 2.2;
      let camDelta = yaw - camYaw;
      while (camDelta > Math.PI) camDelta -= Math.PI * 2;
      while (camDelta < -Math.PI) camDelta += Math.PI * 2;
      camYaw += camDelta * Math.min(1, follow);
      const cfx = -Math.sin(camYaw);
      const cfz = -Math.cos(camYaw);
      const dist = mounted ? 9.2 : 6.4;
      const camH = mounted ? 4.6 : 3.4;
      tmp.set(pos.x - cfx * dist, ground + camH, pos.z - cfz * dist);
      camera.position.lerp(tmp, 1 - Math.pow(0.0015, dt));
      camera.lookAt(pos.x, ground + 1.45, pos.z);
      sun.position.set(pos.x + (hourRef.current === "night" ? -16 : 22), hourRef.current === "night" ? 28 : 36, pos.z + (hourRef.current === "night" ? -10 : 12));
      sun.target.position.set(pos.x, ground, pos.z);
      sun.target.updateMatrixWorld();

      for (const spinner of spinners) spinner.rotation.z = clock.t * 1.4;
      for (const place of valePlaces) {
        const mark = marks.get(place.id);
        const gem = mark?.getObjectByName("gem") as THREE.Mesh | undefined;
        if (!gem) continue;
        gem.rotation.y = clock.t * 1.4;
        gem.position.y = GEM_Y[place.kind] + Math.sin(clock.t * 2 + place.x) * 0.18;
        const mat = gem.material as THREE.MeshStandardMaterial;
        const done = cleared(place.id);
        mat.emissive.set(done ? "#f2d15a" : "#7ec8e3");
        mat.color.set(done ? "#ffe9a0" : "#d7f3ff");
      }

      const place = nearest();
      const label = place ? place.name : null;
      if (label !== lastNear) {
        lastNear = label;
        setNear(label);
        if (label) setLine(`${place?.realm ?? label}. Click the ground to walk. E steps inside.`);
      }
      let touched: string | null = null;
      for (const spot of spirits) {
        const groundY = heightAt(spot.x, spot.z);
        spot.mesh.position.set(spot.x, groundY + Math.sin(clock.t * 2 + spot.x) * 0.12, spot.z);
        spot.mesh.rotation.y = clock.t * 0.7;
        if (Math.hypot(pos.x - spot.x, pos.z - spot.z) < 4.2) touched = spot.id;
      }
      if (touched !== lastSpirit) {
        lastSpirit = touched;
        setSpirit(touched);
        if (touched) {
          const named = valePlaces.find((item) => item.id === touched);
          setLine(`${named?.realm ?? "A spirit"} is in the path. Press E, or answer it.`);
        }
      }
      if (mapOpenRef.current && Math.hypot(pos.x - dotMem.x, pos.z - dotMem.z) > 0.8) {
        dotMem.x = pos.x;
        dotMem.z = pos.z;
        setDot({ x: pos.x, z: pos.z });
      }

      const mini = miniRef.current;
      if (mini) {
        const ctx = mini.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, mini.width, mini.height);
          ctx.drawImage(miniCache, 0, 0);
          const to = (x: number, z: number) => [(x / SPAN) * 36 + 48, (z / SPAN) * 36 + 48];
          for (const item of valePlaces) {
            const p = to(item.x, item.z);
            ctx.fillStyle = cleared(item.id) ? "#f2d15a" : "#fffaf0";
            ctx.beginPath();
            ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
          const me = to(pos.x, pos.z);
          ctx.fillStyle = "#16351f";
          ctx.beginPath();
          ctx.arc(me[0], me[1], 3.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (rainOn) {
        rainMat.opacity = 0.65;
        const arr = rainGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < rainCount; i += 1) {
          let y = arr.getY(i) - dt * 32;
          if (y < 0) y = 18 + hash01(i + Math.floor(clock.t), 40) * 6;
          arr.setY(i, y);
        }
        arr.needsUpdate = true;
        rain.position.set(pos.x, pos.y, pos.z);
      } else {
        rainMat.opacity = 0;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    const onPointerDown = (event: PointerEvent) => {
      if (mapOpenRef.current || insideRef.current || event.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(terrain, false)[0];
      if (!hit) return;
      goal = { x: hit.point.x, z: hit.point.z };
      marker.visible = true;
      marker.position.set(goal.x, heightAt(goal.x, goal.z) + 0.18, goal.z);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const stick = host.parentElement?.querySelector("[data-stick]") as HTMLElement | null;
    const onStickDown = (event: PointerEvent) => {
      if (!stick) return;
      stick.setPointerCapture(event.pointerId);
      onStick(event);
    };
    const onStick = (event: PointerEvent) => {
      if (!stick) return;
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      joy.x = Math.max(-1, Math.min(1, (event.clientX - cx) / (rect.width / 2)));
      joy.y = Math.max(-1, Math.min(1, (cy - event.clientY) / (rect.height / 2)));
    };
    const onStickMove = (event: PointerEvent) => {
      if (event.buttons) onStick(event);
    };
    const endStick = () => {
      joy.x = 0;
      joy.y = 0;
    };
    stick?.addEventListener("pointerdown", onStickDown);
    stick?.addEventListener("pointermove", onStickMove);
    stick?.addEventListener("pointerup", endStick);
    stick?.addEventListener("pointercancel", endStick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      stick?.removeEventListener("pointerdown", onStickDown);
      stick?.removeEventListener("pointermove", onStickMove);
      stick?.removeEventListener("pointerup", endStick);
      stick?.removeEventListener("pointercancel", endStick);
      delete window.__controlsTest;
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material;
          const list = Array.isArray(material) ? material : [material];
          for (const item of list) {
            item.dispose();
            const maps = item as THREE.MeshStandardMaterial;
            maps.map?.dispose();
            maps.normalMap?.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (mapOpen && mapRef.current) paintTerrain(mapRef.current, true);
  }, [mapOpen]);

  const insidePlace = valePlaces.find((item) => item.id === inside) ?? null;
  const place = valePlaces.find((item) => item.name === near) ?? null;
  const active = insidePlace ?? place;
  const topic = active ? nextIn(active.id) : undefined;
  const spiritPlace = valePlaces.find((item) => item.id === spirit) ?? null;

  const travel = (item: Place) => {
    setInside(null);
    setMapOpen(false);
    setQuestsOpen(false);
    setLine(`Traveled to ${item.name}, ${item.realm}.`);
    const event = new CustomEvent("vale-travel", { detail: { x: item.x, z: item.z + 6 } });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const onTravel = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; z: number }>).detail;
      window.__controlsTest?.teleport?.(detail.x, detail.z);
    };
    window.addEventListener("vale-travel", onTravel);
    return () => window.removeEventListener("vale-travel", onTravel);
  }, []);

  const chip = (active: boolean) =>
    `min-h-11 rounded px-3 text-sm font-semibold ${active ? "bg-[#f2d15a] text-[#1a2416]" : "border border-[#d7c7a4]/70 text-[#f4efe4]"}`;

  return (
    <div className="relative bg-[#16324a] text-[#f4efe4]">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
        <p className="font-semibold">{insidePlace ? insidePlace.name : near ?? "The Vale"}</p>
        <p className="min-w-0 flex-1 truncate text-[#d7c7a4]">{riding ? `Riding. ${line}` : line}</p>
        <div className="flex flex-wrap gap-1">
          {HOURS.map((item) => (
            <button key={item.id} type="button" className={chip(hour === item.id)} onClick={() => setHour(item.id)}>
              {item.label}
            </button>
          ))}
          <button type="button" className={chip(weather === "rain")} onClick={() => setWeather((w) => (w === "rain" ? "clear" : "rain"))}>
            {weather === "rain" ? "Clear" : "Rain"}
          </button>
          <button type="button" className={chip(riding)} onClick={() => setRiding((on) => !on)}>
            {riding ? "Dismount" : "Ride"}
          </button>
          <button type="button" onClick={() => setQuestsOpen(true)} className={chip(false)}>
            Quests
          </button>
          <button type="button" onClick={() => setMapOpen(true)} className={chip(false)}>
            Map
          </button>
        </div>
      </div>
      <div ref={mountRef} className="relative h-[70vh] min-h-[420px] w-full" />
      <canvas ref={miniRef} width={96} height={96} className="pointer-events-none absolute top-16 right-3 h-24 w-24 rounded-full border border-[#f4efe4]/50" />
      <div className="flex flex-wrap items-center gap-3 p-3">
        <div data-stick className="relative h-24 w-24 touch-none rounded-full border border-[#d7c7a4] bg-[#0e2418]/50 md:hidden" aria-label="Move" />
        <button
          type="button"
          disabled={insidePlace ? !topic : !place}
          onClick={() => {
            if (insidePlace) {
              if (topic) startTopicBattle(topic.id);
              return;
            }
            if (place) setInside(place.id);
          }}
          className="min-h-11 rounded bg-[#f2d15a] px-4 text-sm font-bold text-[#1a2416] disabled:opacity-40"
        >
          {insidePlace ? (topic ? `Questions · ${topic.short}` : "Hall clear") : place ? `Step into ${place.realm}` : "Walk to a place"}
        </button>
        {insidePlace ? (
          <button type="button" onClick={() => setInside(null)} className="min-h-11 rounded border border-[#d7c7a4] px-4 text-sm font-semibold">
            Leave
          </button>
        ) : null}
        {spiritPlace && !insidePlace ? (
          <button
            type="button"
            onClick={() => {
              const next = nextIn(spiritPlace.id);
              if (next) startTopicBattle(next.id);
              else setLine("That spirit has nothing left to ask.");
            }}
            className="min-h-11 rounded border border-[#f2d15a] px-4 text-sm font-semibold"
          >
            Answer the spirit
          </button>
        ) : null}
        <p className="text-sm text-[#d7c7a4]">Click the ground to walk. WASD still works. F calls the horse. E steps inside.</p>
      </div>
      {mapOpen ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c1c16]/80 p-4">
          <div className="w-full max-w-lg rounded-lg border-4 border-[#8a5a2a] bg-[#e7d3a1] p-4 text-[#3a2a16] shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Vale map</h2>
              <button type="button" onClick={() => setMapOpen(false)} className="min-h-11 px-3 text-sm font-semibold">
                Close
              </button>
            </div>
            <div className="relative">
              <canvas ref={mapRef} width={480} height={480} className="aspect-square w-full rounded" />
              <div
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1c6b3a]"
                style={{ left: `${((dot.x + SPAN) / (SPAN * 2)) * 100}%`, top: `${((dot.z + SPAN) / (SPAN * 2)) * 100}%` }}
              />
              {valePlaces.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => travel(item)}
                  className="absolute min-h-11 -translate-x-1/2 -translate-y-1/2 rounded bg-[#3a2a16]/85 px-2 text-xs font-semibold text-[#f4efe4]"
                  style={{
                    left: `${((item.x + SPAN) / (SPAN * 2)) * 100}%`,
                    top: `${((item.z + SPAN) / (SPAN * 2)) * 100}%`,
                  }}
                >
                  {item.realm}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm">Tap a place to travel. Gold marks on the little map mean that region is cleared.</p>
          </div>
        </div>
      ) : null}
      {questsOpen ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c1c16]/80 p-4">
          <div className="max-h-[80%] w-full max-w-lg overflow-auto rounded-lg border-4 border-[#8a5a2a] bg-[#e7d3a1] p-4 text-[#3a2a16]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-2xl">Quests</h2>
              <button type="button" onClick={() => setQuestsOpen(false)} className="min-h-11 px-3 text-sm font-semibold">
                Close
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {valePlaces.map((item) => {
                const done = cleared(item.id);
                const next = nextIn(item.id);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#8a5a2a]/40 bg-[#f4e7c4] px-3 py-2">
                    <div>
                      <p className="font-semibold">{item.realm}</p>
                      <p className="text-sm">{item.name}. {done ? "Cleared." : next ? `Next: ${next.short}.` : "Open."}</p>
                    </div>
                    <button type="button" onClick={() => travel(item)} className="min-h-11 rounded bg-[#3a2a16] px-3 text-sm font-semibold text-[#f4efe4]">
                      Travel
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm">Spirits on the field ask the same regions. Step into a hall, then start the questions.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
