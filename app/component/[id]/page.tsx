"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Prism from "prismjs";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-scss";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/themes/prism-tomorrow.css";

// Bileşen tipi tanımlaması
type Component = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  previewUrl: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  technologies: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

// Beğeni durumu tipi
type LikeStatus = {
  liked: boolean;
  likeCount: number;
};

export default function ComponentDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const componentId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({
    liked: false,
    likeCount: 0,
  });
  const [isLiking, setIsLiking] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("jsx");
  const codeRef = useRef<HTMLElement>(null);

  // Kod dilini tespit et
  const detectLanguage = (code: string): string => {
    if (!code) return "jsx";

    // Basit bir dil tespiti
    if (code.includes("import React") || code.includes("export default")) {
      if (code.includes("<") && code.includes(">")) {
        return code.includes(": ") || code.includes("<T>") ? "tsx" : "jsx";
      }
      return code.includes(": ") ? "typescript" : "javascript";
    }

    if (
      code.includes("class") &&
      code.includes("{") &&
      code.includes("}") &&
      !code.includes("import")
    ) {
      return "css";
    }

    if (code.includes("$") && code.includes("{") && code.includes("}")) {
      return "scss";
    }

    return "jsx"; // Varsayılan olarak JSX
  };

  // Kodu vurgula
  const highlightCode = useCallback(() => {
    if (component?.code && codeRef.current) {
      const language = detectLanguage(component.code);
      setCodeLanguage(language);
      codeRef.current.className = `language-${language}`;
      codeRef.current.textContent = component.code;
      Prism.highlightElement(codeRef.current);
    }
  }, [component?.code]);

  // Bileşeni getir
  const fetchComponent = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Bileşen getiriliyor, ID:", componentId);

      const response = await fetch(`/api/components/${componentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Bileşen bulunamadı");
        }
        throw new Error("Bileşen getirilirken bir hata oluştu");
      }

      const data = await response.json();
      console.log("Bileşen verisi:", data);

      // API yanıtı { component } şeklinde mi yoksa doğrudan bileşen mi kontrol et
      if (data.component) {
        setComponent(data.component);
      } else if (data.id && data.name) {
        // Doğrudan bileşen döndürülmüşse
        setComponent(data);
      } else {
        throw new Error("Bileşen verisi bulunamadı");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Bileşen getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  }, [componentId]);

  // Beğeni durumunu getir
  const fetchLikeStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/components/${componentId}/like`);

      if (!response.ok) {
        throw new Error("Beğeni durumu getirilirken bir hata oluştu");
      }

      const data = await response.json();
      setLikeStatus(data);
    } catch (err) {
      console.error("Beğeni durumu getirilirken hata:", err);
    }
  }, [componentId]);

  // Beğeni işlemi
  const handleLike = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/component/${componentId}`);
      return;
    }

    try {
      setIsLiking(true);
      const response = await fetch(`/api/components/${componentId}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Beğeni işlemi sırasında bir hata oluştu");
      }

      const data = await response.json();
      setLikeStatus(data);
    } catch (err) {
      console.error("Beğeni işlemi sırasında hata:", err);
    } finally {
      setIsLiking(false);
    }
  };

  // Sayfa yüklendiğinde bileşeni ve beğeni durumunu getir
  useEffect(() => {
    if (componentId) {
      fetchComponent();
      fetchLikeStatus();
    }
  }, [componentId, fetchComponent, fetchLikeStatus]);

  // Kod vurgulamasını uygula
  useEffect(() => {
    if (activeTab === "code") {
      highlightCode();

      // Line numbers için sınıf ekle
      const preElement = codeRef.current?.parentElement;
      if (preElement) {
        preElement.classList.add("line-numbers");
      }

      // Tüm kod bloklarını vurgula
      Prism.highlightAll();
    }
  }, [component?.code, activeTab, highlightCode]);

  // Kodu kopyala
  const copyCode = () => {
    if (component?.code) {
      navigator.clipboard.writeText(component.code);
      alert("Kod panoya kopyalandı!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Hata</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error || "Bileşen bulunamadı"}
          </p>
          <Link
            href="/explore"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
            Bileşenlere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              AI-UI
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/explore"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Keşfet
              </Link>
              {session ? (
                <Link
                  href="/create"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                  Oluştur
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                  Giriş Yap
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
        {/* Bileşen Başlığı ve Bilgileri */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold">{component.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    likeStatus.liked
                      ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  } transition-colors`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${
                      likeStatus.liked
                        ? "text-red-500 fill-red-500"
                        : "text-gray-500"
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    fill="none">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{likeStatus.likeCount}</span>
                </button>
              </div>
              {session?.user?.id === component.user.id && (
                <Link
                  href={`/component/${component.id}/edit`}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Düzenle</span>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                {component.user.image ? (
                  <Image
                    src={component.user.image}
                    alt={component.user.name || "Kullanıcı"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  component.user.name?.charAt(0) || "U"
                )}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {component.user.username || component.user.name || "Kullanıcı"}{" "}
                tarafından oluşturuldu
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {new Date(component.createdAt).toLocaleDateString("tr-TR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {component.description || "Bu bileşen için açıklama bulunmuyor."}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {component.technologies.map((tech) => (
              <span
                key={tech.id}
                className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                {tech.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {component.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Bileşen İçeriği */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "preview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("preview")}>
              Önizleme
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "code"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("code")}>
              Kod
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "preview" ? (
              <div className="min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                {component.previewUrl ? (
                  <Image
                    src={
                      "https://i.ytimg.com/vi/SJm5suVpOK0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA_9hPF_pwjmTQ9m-EcR4RVs9WWPw"
                    }
                    alt={component.name}
                    width={600}
                    height={400}
                    className="max-w-full h-auto"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Bu bileşen için önizleme görseli bulunmuyor.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={copyCode}
                  className="absolute -top-2 right-0 p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Kodu Kopyala">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                    <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                  </svg>
                </button>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-t-lg">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                      {codeLanguage === "jsx" && "React JSX"}
                      {codeLanguage === "tsx" && "React TSX"}
                      {codeLanguage === "javascript" && "JavaScript"}
                      {codeLanguage === "typescript" && "TypeScript"}
                      {codeLanguage === "css" && "CSS"}
                      {codeLanguage === "scss" && "SCSS"}
                    </span>
                  </div>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-b-lg overflow-x-auto text-sm font-mono m-0 line-numbers max-h-[500px] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                    <code ref={codeRef} className={`language-${codeLanguage}`}>
                      {component.code}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
