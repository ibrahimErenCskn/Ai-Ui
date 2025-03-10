import { GoogleGenerativeAI } from "@google/generative-ai";

// API anahtarını .env dosyasından al
const apiKey = process.env.GEMINI_API_KEY || "";

// Gemini API'sini yapılandır
export const genAI = new GoogleGenerativeAI(apiKey);

// Gemini modeli - güncel model adını kullan
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Bileşen oluşturma için prompt şablonu
export const createComponentPrompt = (
  prompt: string,
  technologies: string[]
) => {
  const techString = technologies.join(", ");

  return `
    Bir UI bileşeni oluştur. Kullanıcının isteği: "${prompt}"
    
    Kullanılacak teknolojiler: ${techString || "React, Tailwind CSS"}
    
    Lütfen aşağıdaki JSON formatında yanıt ver:
    {
      "name": "BileşenAdı",
      "description": "Bileşenin kısa açıklaması",
      "code": "// Bileşen kodu burada"
    }
    
    Kod, çalışır durumda ve belirtilen teknolojileri kullanan bir React bileşeni olmalıdır.
    Sadece JSON formatında yanıt ver, başka açıklama ekleme.
  `;
};
