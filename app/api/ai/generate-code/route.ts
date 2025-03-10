import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { model, createComponentPrompt } from "@/app/lib/gemini";

// Yapay zeka ile kod üretme API'si
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı oturumunu kontrol et
    const session = await auth();

    // Kullanıcı giriş yapmamışsa hata döndür
    if (!session?.user) {
      return NextResponse.json(
        { error: "Bu işlem için giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    // İstek gövdesini al
    const body = await request.json();
    const { prompt, technologies = [] } = body;

    // Prompt kontrolü
    if (!prompt) {
      return NextResponse.json({ error: "Prompt zorunludur" }, { status: 400 });
    }

    // Gemini API'sine gönderilecek prompt'u oluştur
    const geminiPrompt = createComponentPrompt(prompt, technologies);

    try {
      // Gemini API'sini çağır
      try {
        const result = await model.generateContent(geminiPrompt);
        const response = await result.response;
        const text = response.text();

        // JSON yanıtını parse et
        try {
          // JSON formatındaki yanıtı parse et
          const jsonMatch = text.match(/\{[\s\S]*\}/);

          if (!jsonMatch) {
            console.warn(
              "Geçerli bir JSON yanıtı alınamadı, fallback'e geçiliyor"
            );
            throw new Error("Geçerli bir JSON yanıtı alınamadı");
          }

          const jsonResponse = JSON.parse(jsonMatch[0]);

          // Gerekli alanları kontrol et
          if (!jsonResponse.name || !jsonResponse.code) {
            console.warn("Eksik alanlar: name veya code, fallback'e geçiliyor");
            throw new Error("Eksik alanlar: name veya code");
          }

          return NextResponse.json({
            name: jsonResponse.name,
            description: jsonResponse.description || "",
            code: jsonResponse.code,
          });
        } catch (jsonError) {
          console.error("JSON parse hatası:", jsonError);

          // Fallback: Basit bir yanıt oluştur
          return NextResponse.json({
            name: "GeneratedComponent",
            description: "Gemini tarafından oluşturulan bileşen",
            code: text.includes("```")
              ? text
                  .split("```")[1]
                  .replace(/^(jsx|tsx|javascript|typescript|js|ts)\n/, "")
              : text,
          });
        }
      } catch (geminiError) {
        console.error("Gemini API hatası:", geminiError);
        console.log("Fallback mekanizmasına geçiliyor...");

        // Fallback: Örnek kod döndür
        return fallbackResponse(prompt, technologies);
      }
    } catch (error) {
      console.error("Kod üretilirken hata oluştu:", error);
      return NextResponse.json(
        {
          error:
            "Kod üretilirken bir hata oluştu: " +
            (error instanceof Error ? error.message : String(error)),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Kod üretilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Kod üretilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Fallback yanıt (Gemini API çalışmazsa)
function fallbackResponse(prompt: string, technologies: string[]) {
  console.log("Fallback yanıtı oluşturuluyor...");

  const isReact = technologies.includes("react") || technologies.length === 0;
  const isTailwind =
    technologies.includes("tailwind") || technologies.length === 0;
  const isTypescript = technologies.includes("typescript");

  let componentName = "GeneratedComponent";
  let description = "Otomatik oluşturulmuş bileşen";
  let code = "";

  // Prompt'a göre bileşen türünü belirle
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes("button") || promptLower.includes("buton")) {
    componentName = "GradientButton";
    description =
      "Hover durumunda büyüyen, gradient arka plana sahip bir buton bileşeni";

    if (isReact && isTailwind) {
      if (isTypescript) {
        code = `
import React from 'react';

interface GradientButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

const GradientButton: React.FC<GradientButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary' 
}) => {
  return (
    <button
      className={\`
        px-6 py-3 rounded-full font-medium transition-all duration-300
        transform hover:scale-105 hover:shadow-lg
        \${variant === 'primary' 
          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' 
          : 'bg-white text-gray-800 border border-gray-200'}
      \`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default GradientButton;
        `;
      } else {
        code = `
import React from 'react';

const GradientButton = ({ label, onClick, variant = 'primary' }) => {
  return (
    <button
      className={\`
        px-6 py-3 rounded-full font-medium transition-all duration-300
        transform hover:scale-105 hover:shadow-lg
        \${variant === 'primary' 
          ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' 
          : 'bg-white text-gray-800 border border-gray-200'}
      \`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default GradientButton;
        `;
      }
    }
  } else if (promptLower.includes("card") || promptLower.includes("kart")) {
    componentName = "FeatureCard";
    description = "İkon, başlık ve açıklama içeren bir özellik kartı bileşeni";

    if (isReact && isTailwind) {
      if (isTypescript) {
        code = `
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;
        `;
      } else {
        code = `
import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;
        `;
      }
    }
  } else if (promptLower.includes("input") || promptLower.includes("form")) {
    componentName = "FormInput";
    description = "Etiket ve hata mesajı içeren bir form input bileşeni";

    if (isReact && isTailwind) {
      if (isTypescript) {
        code = `
import React from 'react';

interface FormInputProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={\`w-full px-3 py-2 border \${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
        } rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white\`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
        `;
      } else {
        code = `
import React from 'react';

const FormInput = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  error,
  placeholder
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={\`w-full px-3 py-2 border \${
          error 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
        } rounded-md shadow-sm focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white\`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
        `;
      }
    }
  } else {
    componentName = "AnimatedComponent";
    description = "Kullanıcının isteğine göre oluşturulmuş bir bileşen";

    if (isReact && isTailwind) {
      if (isTypescript) {
        code = `
import React, { useState } from 'react';

interface AnimatedComponentProps {
  title: string;
  content: string;
}

const AnimatedComponent: React.FC<AnimatedComponentProps> = ({ 
  title, 
  content 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <div 
          className={\`overflow-hidden transition-all duration-300 \${
            isExpanded ? 'max-h-96' : 'max-h-20'
          }\`}
        >
          <p className="text-gray-600 dark:text-gray-300">{content}</p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 dark:text-blue-400 font-medium"
        >
          {isExpanded ? 'Daha Az Göster' : 'Daha Fazla Göster'}
        </button>
      </div>
    </div>
  );
};

export default AnimatedComponent;
        `;
      } else {
        code = `
import React, { useState } from 'react';

const AnimatedComponent = ({ title, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
        <div 
          className={\`overflow-hidden transition-all duration-300 \${
            isExpanded ? 'max-h-96' : 'max-h-20'
          }\`}
        >
          <p className="text-gray-600 dark:text-gray-300">{content}</p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-blue-600 dark:text-blue-400 font-medium"
        >
          {isExpanded ? 'Daha Az Göster' : 'Daha Fazla Göster'}
        </button>
      </div>
    </div>
  );
};

export default AnimatedComponent;
        `;
      }
    }
  }

  console.log("Fallback yanıtı oluşturuldu:", componentName);

  return NextResponse.json({
    name: componentName,
    description: description,
    code: code.trim(),
  });
}
