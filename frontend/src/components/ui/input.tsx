import * as React from "react";

import { cn } from "./utils";

interface InputProps extends React.ComponentProps<"input"> {
  maxLength?: number;
  showCharCount?: boolean;
}

function Input({ className, type = "text", maxLength = 50, showCharCount = false, value = "", ...props }: InputProps) {
  const [charCount, setCharCount] = React.useState(value ? String(value).length : 0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // value değiştiğinde charCount'u güncelle
  React.useEffect(() => {
    setCharCount(value ? String(value).length : 0);
  }, [value]);

  // Otomatik yükseklik ayarlama
  React.useEffect(() => {
    if (textareaRef.current && type !== 'date') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, type]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setCharCount(newValue.length);
      if (props.onChange) {
        // Input event'i oluştur
        const inputEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        props.onChange(inputEvent);
      }
    }
  };

  // Eğer type date, password, text, email veya tel ise normal input kullan
  if (type === 'date' || type === 'password' || type === 'text' || type === 'email' || type === 'tel') {
    return (
      <div className="relative">
        <input
          data-slot="input"
          type={type}
          maxLength={maxLength}
          value={value}
          onChange={props.onChange}
          onKeyPress={props.onKeyPress}
          placeholder={props.placeholder}
          required={props.required}
          id={props.id}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className,
          )}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        data-slot="input"
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        onKeyPress={props.onKeyPress as unknown as React.KeyboardEventHandler<HTMLTextAreaElement>}
        className={cn(
          "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-12 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "break-words",
          className,
        )}
        style={{ 
          wordBreak: 'break-all', 
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          minHeight: '48px',
          lineHeight: '1.5',
          overflow: 'hidden'
        }}
        rows={1}
        {...(props as React.ComponentProps<"textarea">)}
      />
      {showCharCount && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

export { Input };
