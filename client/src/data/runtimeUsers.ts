import { User, UserRole } from '../types';

export interface UserWithPassword extends User {
  password: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

const cloneDeep = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

let usersStore: UserWithPassword[] = [
  {
    id: '1',
    email: 'customer1@example.com',
    firstName: 'عميل',
    lastName: 'تجريبي',
    phone: '+20123456789',
    role: UserRole.CUSTOMER,
    isVerified: true,
    createdAt: new Date().toISOString(),
    password: 'user123',
  },
  {
    id: '2',
    email: 'owner1@aswanfood.com',
    firstName: 'صاحب',
    lastName: 'مطعم',
    phone: '+20123456790',
    role: UserRole.RESTAURANT_OWNER,
    isVerified: true,
    createdAt: new Date().toISOString(),
    password: 'user123',
  },
  {
    id: '3',
    email: 'driver1@aswanfood.com',
    firstName: 'سائق',
    lastName: 'توصيل',
    phone: '+20123456791',
    role: UserRole.DELIVERY_DRIVER,
    isVerified: true,
    createdAt: new Date().toISOString(),
    password: 'user123',
  },
  {
    id: '4',
    email: 'admin@aswanfood.com',
    firstName: 'مدير',
    lastName: 'النظام',
    phone: '+20123456792',
    role: UserRole.ADMIN,
    isVerified: true,
    createdAt: new Date().toISOString(),
    password: 'admin123',
  },
];

export const getUsersWithPassword = (): UserWithPassword[] => usersStore;
export const getUsersPublic = (): User[] => usersStore.map(({ password, ...u }) => u);

export const findUserByEmail = (email: string): UserWithPassword | undefined =>
  usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());

export const addUser = (input: CreateUserInput): UserWithPassword => {
  const existing = findUserByEmail(input.email);
  if (existing) throw new Error('Email already exists');
  const newUser: UserWithPassword = {
    id: Date.now().toString(),
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    role: input.role,
    isVerified: true,
    createdAt: new Date().toISOString(),
    password: input.password,
  };
  usersStore = [...usersStore, newUser];
  return newUser;
};

export const updateUser = (id: string, updates: Partial<UserWithPassword>): UserWithPassword => {
  const idx = usersStore.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('User not found');
  usersStore[idx] = { ...usersStore[idx], ...updates };
  return usersStore[idx];
};

export const deleteUser = (id: string): void => {
  usersStore = usersStore.filter((u) => u.id !== id);
};

export const resetUsersStore = () => {
  // No-op for now; could re-seed defaults
};


