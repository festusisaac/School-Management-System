export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'principal' | 'teacher' | 'student' | 'parent' | 'staff';
  tenantId: string;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

export interface ILoginResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<IUser, 'password'>;
}
