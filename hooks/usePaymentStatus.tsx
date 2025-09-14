import { useState, useEffect, useCallback, useRef } from 'react';
import { paymentApi } from '../lib/api';
import { PaymentStatusResponse } from '../types';

interface UsePaymentStatusOptions {
  transactionId: string;
  onSuccess?: (status: PaymentStatusResponse) => void;
  onFailed?: (status: PaymentStatusResponse) => void;
  onError?: (error: string) => void;
  pollingInterval?: number; // in milliseconds
  maxPollingDuration?: number; // in milliseconds
}

interface UsePaymentStatusReturn {
  status: PaymentStatusResponse | null;
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  refetch: () => Promise<void>;
}

export function usePaymentStatus({
  transactionId,
  onSuccess,
  onFailed,
  onError,
  pollingInterval = 5000, // 5 seconds
  maxPollingDuration = 180000, // 3 minutes
}: UsePaymentStatusOptions): UsePaymentStatusReturn {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    startTimeRef.current = null;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const statusData = await paymentApi.getStatus(transactionId);
      setStatus(statusData);

      // Check if payment is complete
      if (statusData.status === 'Success') {
        onSuccess?.(statusData);
        clearPolling();
      } else if (statusData.status === 'Failed') {
        onFailed?.(statusData);
        clearPolling();
      }

      return statusData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get payment status';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    }
  }, [transactionId, onSuccess, onFailed, onError, clearPolling]);

  const startPolling = useCallback(() => {
    if (isPolling || !transactionId) return;

    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();

    // Fetch immediately
    fetchStatus().catch(() => {
      // Error handled in fetchStatus
    });

    // Set up polling interval
    intervalRef.current = setInterval(async () => {
      const currentTime = Date.now();
      const elapsedTime = startTimeRef.current ? currentTime - startTimeRef.current : 0;

      // Stop polling after max duration
      if (elapsedTime >= maxPollingDuration) {
        const timeoutError = 'Payment processing timed out. Please check your payment status manually.';
        setError(timeoutError);
        onError?.(timeoutError);
        clearPolling();
        return;
      }

      try {
        await fetchStatus();
      } catch (err) {
        // Continue polling on error, but limit retries
        console.warn('Payment status polling error:', err);
      }
    }, pollingInterval);
  }, [isPolling, transactionId, fetchStatus, pollingInterval, maxPollingDuration, onError, clearPolling]);

  const stopPolling = useCallback(() => {
    clearPolling();
    setError(null);
  }, [clearPolling]);

  const refetch = useCallback(async () => {
    if (!transactionId) {
      throw new Error('No transaction ID provided');
    }
    return await fetchStatus();
  }, [fetchStatus, transactionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  // Stop polling when transaction ID changes
  useEffect(() => {
    if (intervalRef.current) {
      clearPolling();
    }
  }, [transactionId, clearPolling]);

  return {
    status,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refetch,
  };
}