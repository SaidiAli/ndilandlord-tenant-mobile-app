import { useState, useCallback } from 'react';

interface UseRetryOptions {
  maxAttempts?: number;
  retryDelay?: number;
}

interface UseRetryResult<T> {
  execute: (operation: () => Promise<T>) => Promise<T>;
  isRetrying: boolean;
  attempts: number;
  reset: () => void;
}

export function useRetry<T>({ 
  maxAttempts = 3, 
  retryDelay = 1000 
}: UseRetryOptions = {}): UseRetryResult<T> {
  const [isRetrying, setIsRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    let currentAttempt = 0;
    
    while (currentAttempt < maxAttempts) {
      try {
        setAttempts(currentAttempt + 1);
        setIsRetrying(currentAttempt > 0);
        
        const result = await operation();
        setIsRetrying(false);
        setAttempts(0);
        return result;
        
      } catch (error: any) {
        currentAttempt++;
        
        if (currentAttempt >= maxAttempts) {
          setIsRetrying(false);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * currentAttempt));
      }
    }
    
    throw new Error('Maximum retry attempts exceeded');
  }, [maxAttempts, retryDelay]);

  const reset = useCallback(() => {
    setIsRetrying(false);
    setAttempts(0);
  }, []);

  return {
    execute,
    isRetrying,
    attempts,
    reset,
  };
}