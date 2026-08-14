export type NasenwandRoute = {
  name: string;
  grade: string;
  length?: string;
  pitches?: string;
};

export type NasenwandSector = {
  name: string;
  count: number;
  integrated: boolean;
};

export const NASENWAND_ROUTES: NasenwandRoute[] = [
  { name: "Hatschi!", grade: "5c" },
  { name: "Nasenbärli", grade: "not supplied" },
  { name: "Nicht gesucht + doch gefunden", grade: "5+", length: "170 m", pitches: "8 pitches" },
  { name: "Zwickolo", grade: "6" },
  { name: "Uhu und Kakadu", grade: "6+" },
  { name: "Aufwind", grade: "6" },
  { name: "Bergrettungsweg", grade: "6+", length: "140 m", pitches: "5 pitches" },
  { name: "Tanz auf der Leiter", grade: "7-/7" },
  { name: "Ein bißchen unrund", grade: "7-/7" },
  { name: "Chaos im Westen", grade: "7+" },
  { name: "Die Prinzessin & das Prunkstück", grade: "8-" },
  { name: "Silberhochzeit", grade: "not supplied" },
];

export const NASENWAND_SECTORS: NasenwandSector[] = [
  { name: "Upper", count: 12, integrated: true },
  { name: "Central", count: 39, integrated: false },
  { name: "Lower", count: 33, integrated: false },
  { name: "Deeper", count: 23, integrated: false },
];
