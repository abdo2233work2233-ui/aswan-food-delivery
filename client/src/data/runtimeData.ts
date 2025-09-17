import { mockRestaurants } from './mockData';

export const cloneDeep = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};

// Mutable runtime store, decoupled from Redux state to avoid freezing
let restaurantsStore: any[] = cloneDeep(mockRestaurants as any);

export const getRestaurantsStore = (): any[] => restaurantsStore;

export const setRestaurantsStore = (next: any[]) => {
  restaurantsStore = next;
};

export const resetRestaurantsStore = () => {
  restaurantsStore = cloneDeep(mockRestaurants as any);
};


