const BOT_TOKEN = '8767887962:AAF4ex27dfGPcYbuL-K6ZyJi1b4e2w0K7IY';
const CHAT_ID = '-1003663543666';

// Compress high-res images to a lightweight base64 string as a local fallback
function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => {
        resolve(e.target?.result as string || '');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadToTelegram(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', file);

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image to Telegram, status: ${response.status}`);
    }

    const data = await response.json();
    const photo = data.result.photo;
    return photo[photo.length - 1].file_id;
  } catch (error) {
    console.warn('Telegram upload API failed, falling back to local compressed base64:', error);
    try {
      const base64LocalUrl = await compressImageToBase64(file);
      return base64LocalUrl;
    } catch (compressErr) {
      console.error('Local compression failed too:', compressErr);
      throw error;
    }
  }
}

export async function getTelegramFileUrl(fileId: string): Promise<string> {
  if (!fileId) return '';
  
  // If already a valid URL or Base64 string, return directly
  if (fileId.startsWith('http') || fileId.startsWith('data:')) {
    return fileId;
  }

  const cacheKey = `tg_file_${fileId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (e) {
    console.warn('Could not read localStorage cache:', e);
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    if (!response.ok) {
      throw new Error('Failed to get file info from Telegram');
    }

    const data = await response.json();
    const filePath = data.result.file_path;
    const finalUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    try {
      localStorage.setItem(cacheKey, finalUrl);
    } catch (e) {
      console.warn('Could not write localStorage cache:', e);
    }

    return finalUrl;
  } catch (err) {
    console.warn('Network issue fetching Telegram media files. Utilizing elegant high-res fallbacks:', err);
    
    // Aesthetic placeholder collection matching telecoms/smartwatches/appliances
    const placeholders = [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop', // Smartphone fallback
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600&auto=format&fit=crop', // Smartwatch fallback
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop', // Audio fallback
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop'  // Laptop fallback
    ];

    let hash = 0;
    for (let i = 0; i < fileId.length; i++) {
      hash = fileId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % placeholders.length;
    return placeholders[index];
  }
}

