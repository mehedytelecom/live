import { useState, useEffect } from 'react';
import { getTelegramFileUrl } from '../services/telegramService';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface TelegramImageProps {
  fileId: string;
  className?: string;
  alt?: string;
}

export default function TelegramImage({ fileId, className, alt }: TelegramImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isDirectUrl = fileId && (fileId.startsWith('http') || fileId.startsWith('data:'));

  useEffect(() => {
    if (isDirectUrl) {
      setUrl(fileId);
      setLoading(false);
      setError(false);
      return;
    }

    let isMounted = true;
    const fetchUrl = async () => {
      setLoading(true);
      setError(false);
      try {
        const fileUrl = await getTelegramFileUrl(fileId);
        if (isMounted) {
          setUrl(fileUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching telegram image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchUrl();
    return () => { isMounted = false; };
  }, [fileId, isDirectUrl]);

  if (isDirectUrl) {
    return (
      <img 
        src={fileId} 
        alt={alt || "Product Image"} 
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (loading) {
    return (
      <div className={cn("bg-gray-100 flex items-center justify-center", className)}>
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={cn("bg-gray-100 flex items-center justify-center", className)}>
        <ImageIcon className="text-gray-300" size={24} />
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt || "Telegram Image"} 
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
