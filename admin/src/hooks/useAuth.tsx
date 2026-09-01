import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import { AdminUser, AdminRole, ADMIN_ROLES } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * True when the signed-in admin holds one of `roles`. Super admins pass every
   * check, mirroring requireRole on the server — keep the two in step.
   */
  can: (...roles: AdminRole[]) => boolean;
  isSuper: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const storedAdmin = localStorage.getItem('admin_user');
      
      if (token && storedAdmin) {
        const isValid = await authApi.validateToken();
        if (isValid) {
          setAdmin(JSON.parse(storedAdmin));
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('admin_token', response.accessToken);
    localStorage.setItem('admin_user', JSON.stringify(response.admin));
    setAdmin(response.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue with logout even if API fails
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  }, []);

  const isSuper = admin?.role === ADMIN_ROLES.SUPER;

  const can = useCallback(
    (...roles: AdminRole[]) => {
      if (!admin) return false;
      if (admin.role === ADMIN_ROLES.SUPER) return true;
      return roles.includes(admin.role);
    },
    [admin]
  );

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        can,
        isSuper,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
