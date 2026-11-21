import * as THREE from "three";

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const cache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key)!;
}

// 내추럴 오크 마루
export const oakFloor = (rx: number, rz: number) =>
  cached(`oak-${rx}-${rz}`, () =>
    canvasTex(
      256,
      256,
      (g) => {
        const tones = ["#d9a066", "#d39a5f", "#dda96f", "#cf955a", "#d6a26a"];
        for (let i = 0; i < 8; i++) {
          const off = (i % 2) * 96;
          for (let x = -off; x < 256; x += 192) {
            g.fillStyle = tones[(i * 3 + Math.abs(x) / 96) % tones.length];
            g.fillRect(x, i * 32, 192, 32);
            g.strokeStyle = "rgba(120,70,30,0.25)";
            g.lineWidth = 2;
            g.strokeRect(x, i * 32, 192, 32);
          }
        }
      },
      [rx, rz],
    ),
  );

// 민트 화이트 모자이크
export const mosaic = (rx: number, ry: number) =>
  cached(`mosaic-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#cfd8cc";
        g.fillRect(0, 0, 128, 128);
        for (let x = 0; x < 128; x += 16)
          for (let y = 0; y < 128; y += 16) {
            g.fillStyle = (x + y) % 48 === 0 ? "#e6ede3" : "#eef3ec";
            g.fillRect(x + 1.5, y + 1.5, 13, 13);
          }
      },
      [rx, ry],
    ),
  );

// 테라코타 타일
export const terracotta = (rx: number, rz: number) =>
  cached(`terra-${rx}-${rz}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#e8d9c4";
        g.fillRect(0, 0, 128, 128);
        const tones = ["#c98a63", "#c47f58", "#cf946c", "#bd7a54"];
        for (let x = 0; x < 128; x += 32)
          for (let y = 0; y < 128; y += 32) {
            g.fillStyle = tones[((x + y * 3) / 32) % tones.length];
            g.fillRect(x + 2, y + 2, 28, 28);
          }
      },
      [rx, rz],
    ),
  );

// 연그레이 현관 타일
export const greyTile = (rx: number, rz: number) =>
  cached(`grey-${rx}-${rz}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#bdbab3";
        g.fillRect(0, 0, 128, 128);
        for (let x = 0; x < 128; x += 64)
          for (let y = 0; y < 128; y += 64) {
            g.fillStyle = "#d8d5ce";
            g.fillRect(x + 2, y + 2, 60, 60);
          }
      },
      [rx, rz],
    ),
  );
