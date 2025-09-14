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
  const isPollingRef = useRef(false);
  
  // Use refs to store callbacks to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onFailedRef = useRef(onFailed);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  
  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Clear polling function using refs to avoid circular dependencies
  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
    setIsPolling(false);
    startTimeRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    // Check ref instead of state to avoid stale closure
    if (isPollingRef.current || !transactionId) return;

    isPollingRef.current = true;
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();

    // Define polling function inline to avoid circular dependencies
    const pollStatus = async (): Promise<boolean> => {
      try {
        setError(null);
        const statusData = await paymentApi.getStatus(transactionId);
        setStatus(statusData);

        // Check if payment is complete
        if (statusData.status === 'Success') {
          onSuccessRef.current?.(statusData);
          // Clear polling inline to avoid circular dependency
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          isPollingRef.current = false;
          setIsPolling(false);
          startTimeRef.current = null;
          return true; // Stop polling
        } else if (statusData.status === 'Failed') {
          onFailedRef.current?.(statusData);
          // Clear polling inline to avoid circular dependency
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          isPollingRef.current = false;
          setIsPolling(false);
          startTimeRef.current = null;
          return true; // Stop polling
        }
        return false; // Continue polling
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to get payment status';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        return false; // Continue polling on error
      }
    };

    // Fetch immediately
    pollStatus();

    // Set up polling interval
    intervalRef.current = setInterval(async () => {
      // Double check if we should still be polling
      if (!isPollingRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const currentTime = Date.now();
      const elapsedTime = startTimeRef.current ? currentTime - startTimeRef.current : 0;

      // Stop polling after max duration
      if (elapsedTime >= maxPollingDuration) {
        const timeoutError = 'Payment processing timed out. Please check your payment status manually.';
        setError(timeoutError);
        onErrorRef.current?.(timeoutError);
        // Clear polling inline
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        isPollingRef.current = false;
        setIsPolling(false);
        startTimeRef.current = null;
        return;
      }

      try {
        const shouldStop = await pollStatus();
        if (shouldStop) {
          return; // Polling already stopped in pollStatus
        }
      } catch (err) {
        // Continue polling on error, but limit retries
        console.warn('Payment status polling error:', err);
      }
    }, pollingInterval);
  }, [transactionId, pollingInterval, maxPollingDuration]);

  const stopPolling = useCallback(() => {
    clearPolling();
    setError(null);
  }, [clearPolling]);

  const refetch = useCallback(async () => {
    if (!transactionId) {
      throw new Error('No transaction ID provided');
    }
    
    try {
      setError(null);
      const statusData = await paymentApi.getStatus(transactionId);
      setStatus(statusData);
      return statusData;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get payment status';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
      throw err;
    }
  }, [transactionId]);

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