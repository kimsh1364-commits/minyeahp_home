export interface CharacterData {
  id: string;
  userId: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  top: string;
  bottom: string;
  shoes: string;
  hat: string;
  accessory: string;
}

export interface FurnitureItem {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
}

export interface RoomData {
  id: string;
  userId: string;
  wallpaper: string;
  floor: string;
  furniture: FurnitureItem[];
}

export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Position;
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string };
}

export interface Friend {
  id: string;
  username: string;
}

export interface FriendRequest {
  id: string;
  sender: Friend;
}

// Item catalog types
export type ItemCategory = "top" | "bottom" | "shoes" | "hat" | "accessory" | "hairStyle" | "hairColor" | "skinTone" | "eyeColor";

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  color?: string;
  previewColor?: string;
}

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  width: number;
  height: number;
  color: string;
}
