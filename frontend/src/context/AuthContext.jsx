import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        if (!tokenStore.get()) {
            setLoading(false);
            return () => controller.abort();
        }
        api.get('/auth/me', { signal: controller.signal })
            .then((data) => setUser(data.user ?? data))
            .catch(() => tokenStore.clear())
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        tokenStore.set(data.token);
        const authenticatedUser = data.user ?? data;
        setUser(authenticatedUser);
        return authenticatedUser;
    }, []);

    const register = useCallback(async (payload) => {
        const data = await api.post('/auth/register', payload);
        tokenStore.set(data.token);
        const authenticatedUser = data.user ?? data;
        setUser(authenticatedUser);
        return authenticatedUser;
    }, []);

    const logout = useCallback(() => {
        tokenStore.clear();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            isStudent: user?.role === 'student',
            isFaculty: user?.role === 'faculty',
            isAdmin: user?.role === 'admin',
            canTeach: user?.role === 'faculty' || user?.role === 'admin',
        }),
        [user, loading, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}