import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    const [allLeases, setAllLeases] = useState<LeaseApiResponse[]>([]);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
    const [isLoadingLeases, setIsLoadingLeases] = useState(false);

    const fetchLeases = async () => {
        if (!user) return;

        try {
            setIsLoadingLeases(true);
            const leases = await tenantApi.getAllLeases();
            setAllLeases(leases);

            // Try to load stored lease ID first
            const storedLeaseId = await secureStorage.getLeaseId();

            // Determine which ID to use
            let leaseToSelectId = selectedLeaseId;

            // If stored ID is valid and exists in our list, prefer it
            if (storedLeaseId && leases.some(l => l.id === storedLeaseId)) {
                leaseToSelectId = storedLeaseId;
            }
            // If we have leases but no selection (and no valid stored selection), pick default
            else if (leases.length > 0 && !leaseToSelectId) {
                // Try to find the first active lease, otherwise fallback to the first one
                const activeLease = leases.find(l => l.status === 'active');
                const defaultLease = activeLease || leases[0];
                leaseToSelectId = defaultLease.id;
            }

            if (leaseToSelectId) {
                setSelectedLeaseId(leaseToSelectId);
                // Ensure the selection is persisted
                if (leaseToSelectId !== storedLeaseId) {
                    await secureStorage.setLeaseId(leaseToSelectId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch leases:', error);
        } finally {
            setIsLoadingLeases(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchLeases();
        } else {
            setAllLeases([]);
            setSelectedLeaseId(null);
        }
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
            refreshLeases: fetchLeases
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
