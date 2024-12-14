import { useMessage } from "@/providers/MessageProvider";

export const useError = () => {
  const { showError } = useMessage();

  const handleError = (error) => {
    showError(error);
  };

  return { handleError };
};
