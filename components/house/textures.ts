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

// 허니 오크 마루
export const oakFloor = (rx: number, rz: number) =>
  cached(`oak-${rx}-${rz}`, () =>
    canvasTex(
      256,
      256,
      (g) => {
        const tones = ["#d9a066", "#d39a5f", "#e0ad72", "#cf955a", "#d8a46b"];
        for (let i = 0; i < 8; i++) {
          const off = (i % 2) * 96;
          for (let x = -off; x < 256; x += 192) {
            g.fillStyle = tones[(i * 3 + Math.abs(x) / 96) % tones.length];
            g.fillRect(x, i * 32, 192, 32);
            g.strokeStyle = "rgba(120,70,30,0.22)";
            g.lineWidth = 2;
            g.strokeRect(x, i * 32, 192, 32);
          }
        }
      },
      [rx, rz],
    ),
  );

// 세이지 민트 모자이크 (2.5cm)
export const mosaic = (rx: number, ry: number) =>
  cached(`mosaic-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#e3eadf";
        g.fillRect(0, 0, 128, 128);
        for (let x = 0; x < 128; x += 16)
          for (let y = 0; y < 128; y += 16) {
            g.fillStyle = (x * 7 + y * 3) % 80 === 0 ? "#bccdb9" : "#c7d6c3";
            g.fillRect(x + 1.5, y + 1.5, 13, 13);
          }
      },
      [rx, ry],
    ),
  );

// 화이트 페니 타일 (+ 민트 꽃무늬 포인트)
export const penny = (rx: number, ry: number) =>
  cached(`penny-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#dcdcd4";
        g.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 128; y += 8)
          for (let x = 0; x < 128; x += 8) {
            const ox = (y / 8) % 2 ? 4 : 0;
            const flower = (x === 64 && y === 64) || (Math.abs(x - 64) === 8 && y === 64) || (x === 64 && Math.abs(y - 64) === 8);
            g.fillStyle = flower ? "#b9d0bc" : "#fbfbf7";
            g.beginPath();
            g.arc(x + ox + 4, y + 4, 3.3, 0, Math.PI * 2);
            g.fill();
          }
      },
      [rx, ry],
    ),
  );

// 바둑판 체커
export const checker = (a: string, b: string, n: number, rx: number, ry: number) =>
  cached(`chk-${a}-${b}-${n}-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        const s = 128 / n;
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            g.fillStyle = (i + j) % 2 ? a : b;
            g.fillRect(i * s, j * s, s, s);
          }
      },
      [rx, ry],
    ),
  );

// 버건디 빈티지 줄무늬 원단
export const stripes = (rx = 1, ry = 1) =>
  cached(`stripe-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#8a2a31";
        g.fillRect(0, 0, 128, 128);
        const lines: [number, number, string][] = [
          [10, 2, "#e8d6bd"], [14, 1, "#e8d6bd"], [17, 3, "#c98a3d"], [22, 1, "#e8d6bd"],
          [52, 2, "#e8d6bd"], [57, 2, "#5b1a20"], [62, 1, "#e8d6bd"],
          [84, 1, "#e8d6bd"], [88, 3, "#c98a3d"], [93, 1, "#e8d6bd"], [96, 2, "#e8d6bd"],
        ];
        for (const [x, w, c] of lines) {
          g.fillStyle = c;
          g.fillRect(x, 0, w, 128);
        }
        // 직조 느낌
        g.fillStyle = "rgba(0,0,0,0.06)";
        for (let y = 0; y < 128; y += 3) g.fillRect(0, y, 128, 1);
      },
      [rx, ry],
    ),
  );

// 버터 깅엄 체크
export const gingham = (rx: number, ry: number, color = "rgba(236,196,92,0.55)") =>
  cached(`ging-${rx}-${ry}-${color}`, () =>
    canvasTex(
      64,
      64,
      (g) => {
        g.fillStyle = "#fffaf0";
        g.fillRect(0, 0, 64, 64);
        g.fillStyle = color;
        g.fillRect(0, 0, 32, 64);
        g.fillRect(0, 0, 64, 32);
      },
      [rx, ry],
    ),
  );

// 책등 (책장 정면)
export const books = () =>
  cached("books", () =>
    canvasTex(
      256,
      128,
      (g) => {
        g.fillStyle = "#b97a47";
        g.fillRect(0, 0, 256, 128);
        const colors = ["#8a2a31", "#e7c25f", "#5e7b4c", "#f3ead8", "#c9673e", "#3e4d63", "#d9a441", "#a9c1a0"];
        for (const [y0, y1] of [[6, 60], [68, 122]]) {
          let x = 6;
          let i = y0;
          while (x < 240) {
            const w = 8 + ((i * 7) % 9);
            const h = (y1 - y0) * (0.72 + ((i * 13) % 25) / 100);
            g.fillStyle = colors[(i * 5) % colors.length];
            g.fillRect(x, y1 - h, w, h);
            x += w + 1;
            i++;
          }
        }
      },
      [1, 1],
    ),
  );

// 코듀로이 (골지 결)
export const corduroy = (base: string, rx: number, ry: number) =>
  cached(`cord-${base}-${rx}-${ry}`, () =>
    canvasTex(
      64,
      64,
      (g) => {
        g.fillStyle = base;
        g.fillRect(0, 0, 64, 64);
        g.fillStyle = "rgba(120,80,20,0.12)";
        for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1.5, 64);
      },
      [rx, ry],
    ),
  );

// 그린 타탄 체크 (레퍼런스 소파)
export const plaid = (rx: number, ry: number) =>
  cached(`plaid-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#3f7a4e";
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = "rgba(20,60,35,0.55)";
        g.fillRect(0, 40, 128, 26);
        g.fillRect(40, 0, 26, 128);
        g.fillStyle = "rgba(240,230,205,0.75)";
        for (const v of [20, 100]) {
          g.fillRect(0, v, 128, 3);
          g.fillRect(v, 0, 3, 128);
        }
        g.fillStyle = "rgba(240,230,205,0.35)";
        for (const v of [52, 58]) {
          g.fillRect(0, v, 128, 1.5);
          g.fillRect(v, 0, 1.5, 128);
        }
      },
      [rx, ry],
    ),
  );

// 도트
export const dots = (bg: string, dot: string, n: number, rx: number, ry: number) =>
  cached(`dots-${bg}-${dot}-${n}-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = dot;
        const s = 128 / n;
        for (let i = 0; i < n; i++)
          for (let j = 0; j < n; j++) {
            g.beginPath();
            g.arc(i * s + s / 2 + (j % 2 ? s / 2 : 0), j * s + s / 2, s * 0.2, 0, Math.PI * 2);
            g.fill();
            if (j % 2) {
              g.beginPath();
              g.arc(i * s + s / 2 - s / 2, j * s + s / 2, s * 0.2, 0, Math.PI * 2);
              g.fill();
            }
          }
      },
      [rx, ry],
    ),
  );

// 아가일 러그
export const argyle = (rx: number, ry: number) =>
  cached(`argyle-${rx}-${ry}`, () =>
    canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#e9e2d4";
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = "#8f8a7e";
        for (const [cx, cy] of [[32, 32], [96, 96]]) {
          g.beginPath();
          g.moveTo(cx, cy - 24);
          g.lineTo(cx + 16, cy);
          g.lineTo(cx, cy + 24);
          g.lineTo(cx - 16, cy);
          g.fill();
        }
      },
      [rx, ry],
    ),
  );

// 블루 타원 러그: 하얀 토끼 + 작은 꽃
export const bunnyRug = () =>
  cached("bunnyrug", () =>
    canvasTex(
      256,
      256,
      (g) => {
        g.fillStyle = "#24479a";
        g.fillRect(0, 0, 256, 256);
        // 토끼 (단순한 실루엣)
        g.fillStyle = "#fbf8f0";
        g.beginPath();
        g.ellipse(128, 140, 70, 34, -0.15, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(70, 120, 26, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(52, 82, 9, 28, -0.4, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(76, 80, 9, 28, 0.15, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#24479a";
        g.beginPath();
        g.arc(64, 118, 3.5, 0, Math.PI * 2);
        g.fill();
        // 꽃
        const flower = (x: number, y: number, c: string) => {
          g.fillStyle = c;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            g.beginPath();
            g.arc(x + Math.cos(a) * 7, y + Math.sin(a) * 7, 6, 0, Math.PI * 2);
            g.fill();
          }
          g.fillStyle = "#f6d55c";
          g.beginPath();
          g.arc(x, y, 4, 0, Math.PI * 2);
          g.fill();
        };
        [[40, 200, "#f4b6c2"], [200, 60, "#f6d55c"], [210, 200, "#a9c8ea"], [130, 40, "#fbf8f0"], [100, 220, "#f4b6c2"], [220, 130, "#fbf8f0"]].forEach(([x, y, c]) =>
          flower(x as number, y as number, c as string),
        );
      },
      [1, 1],
    ),
  );

// 파스텔 패치워크 쿠션
export const patchwork = () =>
  cached("patch", () =>
    canvasTex(
      96,
      96,
      (g) => {
        const cs = ["#f6d55c", "#f4b6c2", "#fbf8f0", "#bfe3c9", "#a9c8ea", "#f3d9a4", "#fbf8f0", "#bfe3c9", "#f6d55c"];
        cs.forEach((c, i) => {
          g.fillStyle = c;
          g.fillRect((i % 3) * 32 + 1, Math.floor(i / 3) * 32 + 1, 30, 30);
        });
      },
      [1, 1],
    ),
  );

// 핑크 스트라이프 (드럼 펜던트)
export const pinkStripe = () =>
  cached("pinkstripe", () =>
    canvasTex(
      32,
      64,
      (g) => {
        g.fillStyle = "#fff6f3";
        g.fillRect(0, 0, 32, 64);
        g.fillStyle = "#ee8fa6";
        for (let y = 0; y < 64; y += 6) g.fillRect(0, y, 32, 2.5);
      },
      [1, 1],
    ),
  );
