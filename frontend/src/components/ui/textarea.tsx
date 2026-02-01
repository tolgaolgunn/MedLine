import * as React from "react";

import { cn } from "./utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  maxLength?: number;
  showCharCount?: boolean;
  charCountType?: 'general' | 'usage' | 'custom';
}

function Textarea({ 
  className, 
  maxLength = 200, 
  showCharCount = false, 
  charCountType = 'general',
  value = "",
  ...props 
}: TextareaProps) {
  const [charCount, setCharCount] = React.useState(value ? String(value).length : 0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // value değiştiğinde charCount'u güncelle
  React.useEffect(() => {
    setCharCount(value ? String(value).length : 0);
  }, [value]);

  // Otomatik yükseklik ayarlama
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setCharCount(newValue.length);
      if (props.onChange) {
        props.onChange(e);
      }
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        className={cn(
          "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "break-words",
          className,
        )}
        style={{ 
          wordBreak: 'break-word', 
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden'
        }}
        {...props}
      />
      {showCharCount && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

export { Textarea };
