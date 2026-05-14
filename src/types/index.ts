export type { Role, SignalementStatus, SignalementCategory, ProjectStatus, ConsultationStatus } from "@/generated/prisma";

/** GeoJSON Point used for map interactions (client-side, before DB persistence) */
export interface GeoPoint {
  lng: number;
  lat: number;
}

/** Lightweight signalement summary for map markers */
export interface SignalementMarker {
  id: string;
  title: string;
  category: string;
  status: string;
  location: GeoPoint;
  createdAt: string;
}

/** Lightweight project summary for map markers */
export interface ProjectMarker {
  id: string;
  title: string;
  sector: string;
  status: string;
  advancementRate: number;
  location: GeoPoint | null;
}

/** Session user payload (stored in JWT / session) */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  wilaya?: string | null;
  ministere?: string | null;
}
