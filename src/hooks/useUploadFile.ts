import { useMutation } from '@tanstack/react-query';

export function useUploadFile() {
  return useMutation({
    mutationFn: async (_file: File): Promise<string[][]> => {
      console.warn('[useUploadFile] File upload not implemented in MVP');
      return [];
    },
  });
}
