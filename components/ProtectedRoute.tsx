"use client";

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

    // If not logged in, we could render null or a loading spinner
    // avoiding flashing content before redirect
    if (!isLoggedIn) {
        return null;
    }

    return <>{children}</>;
}
