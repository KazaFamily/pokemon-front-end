// Tracks which Trainer this browser is currently playing as. The backend has no
// concept of "my trainers" list yet, so we just remember the last created/used one.
const STORAGE_KEY = "pokemon.myTrainerId";

export function getMyTrainerId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setMyTrainerId(trainerId: string): void {
  localStorage.setItem(STORAGE_KEY, trainerId);
}

export function clearMyTrainerId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
