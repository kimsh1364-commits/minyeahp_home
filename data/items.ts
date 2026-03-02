import { GameItem, FurnitureCatalogItem } from "@/types/game";

export const SKIN_TONES: GameItem[] = [
  { id: "light", name: "밝은 피부", category: "skinTone", color: "#FDDBB4" },
  { id: "medium", name: "중간 피부", category: "skinTone", color: "#D4956A" },
  { id: "tan", name: "태닝 피부", category: "skinTone", color: "#C68642" },
  { id: "dark", name: "어두운 피부", category: "skinTone", color: "#8D5524" },
];

export const HAIR_COLORS: GameItem[] = [
  { id: "black", name: "검정", category: "hairColor", color: "#1a1a1a" },
  { id: "brown", name: "갈색", category: "hairColor", color: "#8B4513" },
  { id: "blonde", name: "금발", category: "hairColor", color: "#F4C430" },
  { id: "red", name: "빨강", category: "hairColor", color: "#C0392B" },
  { id: "pink", name: "핑크", category: "hairColor", color: "#FF69B4" },
  { id: "purple", name: "보라", category: "hairColor", color: "#8B5CF6" },
  { id: "blue", name: "파랑", category: "hairColor", color: "#3B82F6" },
  { id: "white", name: "흰색", category: "hairColor", color: "#F8F8F8" },
];

export const EYE_COLORS: GameItem[] = [
  { id: "brown", name: "갈색 눈", category: "eyeColor", color: "#8B4513" },
  { id: "black", name: "검정 눈", category: "eyeColor", color: "#1a1a1a" },
  { id: "blue", name: "파란 눈", category: "eyeColor", color: "#3B82F6" },
  { id: "green", name: "초록 눈", category: "eyeColor", color: "#22C55E" },
  { id: "red", name: "빨간 눈", category: "eyeColor", color: "#EF4444" },
];

export const HAIR_STYLES: GameItem[] = [
  { id: "short", name: "단발", category: "hairStyle" },
  { id: "long", name: "장발", category: "hairStyle" },
  { id: "twin", name: "양갈래", category: "hairStyle" },
  { id: "bob", name: "단정한 단발", category: "hairStyle" },
  { id: "curly", name: "웨이브", category: "hairStyle" },
  { id: "ponytail", name: "포니테일", category: "hairStyle" },
];

export const TOPS: GameItem[] = [
  { id: "default_top", name: "흰 티셔츠", category: "top", color: "#FFFFFF", previewColor: "#FFFFFF" },
  { id: "stripe_top", name: "스트라이프", category: "top", color: "#4A90E2", previewColor: "#4A90E2" },
  { id: "hoodie", name: "후디", category: "top", color: "#6B7280", previewColor: "#6B7280" },
  { id: "pink_top", name: "핑크 블라우스", category: "top", color: "#F9A8D4", previewColor: "#F9A8D4" },
  { id: "green_top", name: "초록 셔츠", category: "top", color: "#86EFAC", previewColor: "#86EFAC" },
  { id: "yellow_top", name: "노랑 티", category: "top", color: "#FDE68A", previewColor: "#FDE68A" },
  { id: "red_top", name: "빨강 스웨터", category: "top", color: "#FCA5A5", previewColor: "#FCA5A5" },
  { id: "purple_top", name: "보라 블라우스", category: "top", color: "#C4B5FD", previewColor: "#C4B5FD" },
];

export const BOTTOMS: GameItem[] = [
  { id: "default_bottom", name: "청바지", category: "bottom", color: "#2563EB", previewColor: "#2563EB" },
  { id: "black_pants", name: "검정 바지", category: "bottom", color: "#1F2937", previewColor: "#1F2937" },
  { id: "skirt_pink", name: "핑크 치마", category: "bottom", color: "#FBCFE8", previewColor: "#FBCFE8" },
  { id: "skirt_white", name: "흰 치마", category: "bottom", color: "#F9FAFB", previewColor: "#F9FAFB" },
  { id: "shorts_blue", name: "파랑 반바지", category: "bottom", color: "#93C5FD", previewColor: "#93C5FD" },
  { id: "green_pants", name: "초록 바지", category: "bottom", color: "#86EFAC", previewColor: "#86EFAC" },
];

export const SHOES: GameItem[] = [
  { id: "default_shoes", name: "운동화", category: "shoes", color: "#9CA3AF", previewColor: "#9CA3AF" },
  { id: "black_shoes", name: "검정 구두", category: "shoes", color: "#111827", previewColor: "#111827" },
  { id: "pink_shoes", name: "핑크 부츠", category: "shoes", color: "#F9A8D4", previewColor: "#F9A8D4" },
  { id: "brown_boots", name: "갈색 부츠", category: "shoes", color: "#92400E", previewColor: "#92400E" },
  { id: "white_shoes", name: "흰 운동화", category: "shoes", color: "#F9FAFB", previewColor: "#F9FAFB" },
];

export const HATS: GameItem[] = [
  { id: "none", name: "없음", category: "hat" },
  { id: "beret_black", name: "검정 베레모", category: "hat", color: "#1F2937" },
  { id: "beret_red", name: "빨강 베레모", category: "hat", color: "#DC2626" },
  { id: "cap_blue", name: "파랑 야구모자", category: "hat", color: "#2563EB" },
  { id: "cat_ears", name: "고양이 귀", category: "hat", color: "#F9A8D4" },
  { id: "bunny_ears", name: "토끼 귀", category: "hat", color: "#F9FAFB" },
  { id: "flower_crown", name: "꽃 왕관", category: "hat", color: "#FDE68A" },
];

export const ACCESSORIES: GameItem[] = [
  { id: "none", name: "없음", category: "accessory" },
  { id: "glasses_round", name: "둥근 안경", category: "accessory", color: "#9CA3AF" },
  { id: "glasses_cat", name: "캣아이 안경", category: "accessory", color: "#1F2937" },
  { id: "scarf_red", name: "빨강 목도리", category: "accessory", color: "#DC2626" },
  { id: "bow_pink", name: "핑크 리본", category: "accessory", color: "#F9A8D4" },
];

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  { id: "sofa", name: "소파", width: 3, height: 1, color: "#8B4513" },
  { id: "table", name: "테이블", width: 2, height: 1, color: "#D2B48C" },
  { id: "bed", name: "침대", width: 3, height: 2, color: "#F0E6FF" },
  { id: "bookshelf", name: "책장", width: 1, height: 2, color: "#6B4C32" },
  { id: "plant", name: "화분", width: 1, height: 1, color: "#22C55E" },
  { id: "tv", name: "TV", width: 2, height: 1, color: "#1F2937" },
  { id: "dresser", name: "서랍장", width: 2, height: 1, color: "#C8A882" },
  { id: "rug_pink", name: "핑크 러그", width: 3, height: 2, color: "#FBCFE8" },
  { id: "lamp", name: "스탠드 조명", width: 1, height: 1, color: "#FDE68A" },
  { id: "desk", name: "책상", width: 2, height: 1, color: "#C8A882" },
];

export const WALLPAPERS = [
  { id: "white", name: "흰 벽", color: "#F9FAFB" },
  { id: "pink", name: "핑크 벽", color: "#FBCFE8" },
  { id: "blue", name: "파랑 벽", color: "#DBEAFE" },
  { id: "green", name: "초록 벽", color: "#DCFCE7" },
  { id: "yellow", name: "노랑 벽", color: "#FEF9C3" },
  { id: "purple", name: "보라 벽", color: "#EDE9FE" },
  { id: "striped", name: "줄무늬 벽", color: "#E0F2FE" },
];

export const FLOORS = [
  { id: "wood", name: "원목 바닥", color: "#C8A882" },
  { id: "dark_wood", name: "다크 원목", color: "#6B4C32" },
  { id: "tile", name: "타일 바닥", color: "#E5E7EB" },
  { id: "carpet_pink", name: "핑크 카펫", color: "#FBCFE8" },
  { id: "carpet_green", name: "초록 카펫", color: "#86EFAC" },
  { id: "marble", name: "대리석", color: "#F1F5F9" },
];
