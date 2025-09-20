import { useState, useEffect, useCallback } from 'react';
import { tenantApi } from '../lib/api';
import { TenantDashboardData } from '../types';

interface UseTenantLeaseResult {
  leaseId: string | null;
  leaseData: TenantDashboardData['lease'] | null;
  tenantData: TenantDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshLease: () => Promise<void>;
}

export function useTenantLease(): UseTenantLeaseResult {
  const [tenantData, setTenantData] = useState<TenantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await tenantApi.getDashboard();
      setTenantData(data);
    } catch (err: any) {
      console.error('Failed to fetch tenant lease data:', err);
      setError(err.message || 'Failed to load lease information');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  const refreshLease = useCallback(async () => {
    await fetchTenantData();
  }, [fetchTenantData]);

  return {
    leaseId: tenantData?.lease?.id || null,
    leaseData: tenantData?.lease || null,
    tenantData,
    isLoading,
    error,
    refreshLease,
  };
}