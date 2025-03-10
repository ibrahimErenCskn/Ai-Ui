"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type TechnologyKey = "react" | "tailwind" | "typescript";

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [componentDescription, setComponentDescription] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState({
    react: true,
    tailwind: true,
    typescript: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAiCode, setIsGeneratingAiCode] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/create");
    }
  }, [status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleTechnologyChange = (tech: TechnologyKey) => {
    setSelectedTechnologies((prev) => ({
      ...prev,
      [tech]: !prev[tech],
    }));
  };

  // Etiket ekleme
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Etiket silme
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Bileşen oluşturma
  const handleGenerateComponent = async () => {
    if (!componentName || !componentCode) {
      setError("Bileşen adı ve kodu zorunludur.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Seçili teknolojileri diziye dönüştür
      const technologies = Object.entries(selectedTechnologies)
        .filter(([_, isSelected]) => isSelected)
        .map(([tech]) => tech);

      const response = await fetch("/api/components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: componentName,
          description: componentDescription,
          code: componentCode,
          previewUrl: previewUrl || null,
          technologies,
          tags,
          status: "PUBLISHED", // Varsayılan olarak yayınla
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Bileşen oluşturulurken bir hata oluştu"
        );
      }

      const data = await response.json();

      // Başarılı olduğunda dashboard'a yönlendir
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Bileşen oluşturulurken hata:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Yapay zeka ile kod üretme
  const handleGenerateAiCode = async () => {
    if (!aiPrompt) {
      setAiError("Lütfen bir prompt girin.");
      return;
    }

    setIsGeneratingAiCode(true);
    setAiError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/ai/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          technologies: Object.entries(selectedTechnologies)
            .filter(([_, isSelected]) => isSelected)
            .map(([tech]) => tech),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kod üretilirken bir hata oluştu");
      }

      const data = await response.json();

      // Gemini'nin ürettiği kodu ve diğer bilgileri al
      setComponentCode(data.code);

      // Eğer bileşen adı boşsa, Gemini'nin önerdiği adı kullan
      if (!componentName && data.name) {
        setComponentName(data.name);
      }

      // Eğer açıklama boşsa, Gemini'nin önerdiği açıklamayı kullan
      if (!componentDescription && data.description) {
        setComponentDescription(data.description);
      }

      // Başarı mesajı göster
      setSuccess("Kod başarıyla üretildi! Alanlar otomatik olarak dolduruldu.");

      // 3 saniye sonra başarı mesajını kaldır
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Kod üretilirken hata:", err);

      // Gemini API hatası mı kontrol et
      if (err instanceof Error && err.message.includes("Gemini")) {
        setAiError(
          "Gemini API şu anda kullanılamıyor. Hazır şablonlar kullanılıyor."
        );
      } else {
        setAiError(err instanceof Error ? err.message : "Bir hata oluştu");
      }

      // Hata mesajını 5 saniye sonra kaldır
      setTimeout(() => {
        setAiError(null);
      }, 5000);
    } finally {
      setIsGeneratingAiCode(false);
    }
  };

  // Menüyü aç/kapat
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Menü dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container") && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Yükleniyor durumu
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamışsa
  if (status === "unauthenticated") {
    return null; // useEffect ile yönlendirme yapılacak
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
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <div className="relative user-menu-container">
                <button
                  onClick={toggleMenu}
                  className="flex items-center gap-2 focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">
                    {session?.user?.name?.split(" ")[0] || "Kullanıcı"}
                  </span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Profil
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Ayarlar
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Yeni Bileşen Oluştur</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Yapay zeka ile yeni bir UI bileşeni tasarlayın. Ne istediğinizi
            açıklayın ve AI sizin için bir bileşen oluştursun.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Input */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Bileşen Detayları</h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="componentName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bileşen Adı
                  </label>
                  <input
                    type="text"
                    id="componentName"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Örn: AnimatedButton"
                  />
                </div>

                <div>
                  <label
                    htmlFor="componentDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bileşen Açıklaması
                  </label>
                  <textarea
                    id="componentDescription"
                    rows={4}
                    value={componentDescription}
                    onChange={(e) => setComponentDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Bileşeninizi detaylı olarak açıklayın. Örn: Hover durumunda yumuşak bir animasyon gösteren, farklı renk seçenekleri olan bir buton bileşeni."></textarea>
                </div>

                <div>
                  <label
                    htmlFor="aiPrompt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <span>Yapay Zeka Prompt'u</span>
                      <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                        Gemini AI
                      </span>
                    </div>
                  </label>
                  <div className="relative">
                    <textarea
                      id="aiPrompt"
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Yapay zekaya ne tür bir bileşen oluşturmasını istediğinizi açıklayın. Örn: Hover durumunda büyüyen, içinde ikon ve metin olan, farklı renk seçenekleri sunan bir buton bileşeni oluştur."></textarea>
                    <button
                      type="button"
                      onClick={handleGenerateAiCode}
                      disabled={isGeneratingAiCode}
                      className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                      {isGeneratingAiCode ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Kod Üretiliyor...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                          Gemini ile Kod Üret
                        </>
                      )}
                    </button>
                  </div>
                  {aiError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {aiError}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Google'ın Gemini AI teknolojisi, seçtiğiniz teknolojilere
                    uygun bir bileşen kodu üretecektir.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="previewUrl"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Önizleme URL (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    id="previewUrl"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Örn: https://example.com/image.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teknolojiler
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="react"
                        className="mr-2"
                        checked={selectedTechnologies.react}
                        onChange={() => handleTechnologyChange("react")}
                      />
                      <label htmlFor="react">React</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="tailwind"
                        className="mr-2"
                        checked={selectedTechnologies.tailwind}
                        onChange={() => handleTechnologyChange("tailwind")}
                      />
                      <label htmlFor="tailwind">Tailwind CSS</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="typescript"
                        className="mr-2"
                        checked={selectedTechnologies.typescript}
                        onChange={() => handleTechnologyChange("typescript")}
                      />
                      <label htmlFor="typescript">TypeScript</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Etiketler
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {tag}
                        </span>
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-gray-500 hover:text-red-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddTag} className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Yeni etiket ekle"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-md transition-colors">
                      Ekle
                    </button>
                  </form>
                </div>

                <button
                  className={`w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors flex items-center justify-center ${
                    isGenerating ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleGenerateComponent}
                  disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Bileşen Oluşturuluyor...
                    </>
                  ) : (
                    "Bileşen Oluştur"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  Kod
                </div>
              </div>

              {/* Code Editor */}
              <div className="p-4">
                <textarea
                  className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={componentCode}
                  onChange={(e) => setComponentCode(e.target.value)}
                  placeholder="// Bileşen kodunuzu buraya yazın
import React from 'react';

export default function MyComponent() {
  return (
    <div>
      <h1>Merhaba Dünya</h1>
    </div>
  );
}"></textarea>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
