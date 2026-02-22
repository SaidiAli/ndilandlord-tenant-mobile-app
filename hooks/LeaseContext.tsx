import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../lib/api';
import { LeaseApiResponse } from '../types';
import { secureStorage } from '../lib/storage';
import { useAuth } from './useAuth';

interface LeaseContextType {
    allLeases: LeaseApiResponse[];
    selectedLeaseId: string | null;
    selectedLease: LeaseApiResponse | null;
    isLoadingLeases: boolean;
    switchLease: (leaseId: string) => Promise<void>;
    refreshLeases: () => Promise<void>;
}

const LeaseContext = createContext<LeaseContextType | undefined>(undefined);

export function LeaseProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);

    const { data: allLeases = [], isLoading: isLoadingLeases, refetch } = useQuery({
        queryKey: ['all-leases'],
        queryFn: tenantApi.getAllLeases,
        enabled: !!user,
    });

    // Select a lease when the list loads or changes
    useEffect(() => {
        if (!user || allLeases.length === 0) return;

        (async () => {
            const storedId = await secureStorage.getLeaseId();
            let toSelect = selectedLeaseId;

            if (storedId && allLeases.some(l => l.id === storedId)) {
                toSelect = storedId;
            } else if (!toSelect) {
                const active = allLeases.find(l => l.status === 'active');
                toSelect = (active || allLeases[0]).id;
            }

            if (toSelect) {
                setSelectedLeaseId(toSelect);
                if (toSelect !== storedId) {
                    await secureStorage.setLeaseId(toSelect);
                }
            }
        })();
    }, [allLeases, user]);

    // Clear selection on logout
    useEffect(() => {
        if (!user) setSelectedLeaseId(null);
    }, [user]);

    const switchLease = async (leaseId: string) => {
        setSelectedLeaseId(leaseId);
        await secureStorage.setLeaseId(leaseId);
    };

    const selectedLease = allLeases.find(l => l.id === selectedLeaseId) || null;

    return (
        <LeaseContext.Provider value={{
            allLeases,
            selectedLeaseId,
            selectedLease,
            isLoadingLeases,
            switchLease,
            refreshLeases: async () => { await refetch(); },
        }}>
            {children}
        </LeaseContext.Provider>
    );
}

export function useLease() {
    const context = useContext(LeaseContext);
    if (context === undefined) {
        throw new Error('useLease must be used within a LeaseProvider');
    }
    return context;
}
