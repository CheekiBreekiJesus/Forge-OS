type FormFieldErrorProps = {
  message?: string | null;
};

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}
