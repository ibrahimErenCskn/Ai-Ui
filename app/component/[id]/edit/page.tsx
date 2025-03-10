"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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

export default function EditComponentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const componentId = Array.isArray(params.id) ? params.id[0] : params.id;

  // State tanımlamaları
  const [component, setComponent] = useState<Component | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTechnology, setNewTechnology] = useState("");
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Bileşen verilerini getir
  useEffect(() => {
    const fetchComponent = async () => {
      if (!componentId) {
        setError("Bileşen ID'si bulunamadı");
        setLoading(false);
        return;
      }

      if (status === "loading") return;

      try {
        setLoading(true);
        console.log("Bileşen getiriliyor, ID:", componentId);

        const response = await fetch(`/api/components/${componentId}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API yanıtı:", response.status, errorText);
          throw new Error(
            `Bileşen getirilirken bir hata oluştu: ${response.status}`
          );
        }

        const data = await response.json();
        console.log("Bileşen verisi:", data);
        console.log("data.component var mı:", !!data.component);
        console.log("data içeriği:", JSON.stringify(data, null, 2));

        if (!data.component) {
          // API doğrudan bileşeni döndürüyorsa, data'yı component olarak kullan
          if (data.id && data.name && data.code) {
            console.log("Bileşen doğrudan döndürülmüş, data kullanılıyor");
            setComponent(data);

            // Form alanlarını doldur
            setName(data.name);
            setDescription(data.description || "");
            setCode(data.code);
            setTechnologies(data.technologies.map((tech: any) => tech.name));
            setTags(data.tags.map((tag: any) => tag.name));
          } else {
            throw new Error("Bileşen verisi bulunamadı");
          }
        } else {
          setComponent(data.component);

          // Form alanlarını doldur
          setName(data.component.name);
          setDescription(data.component.description || "");
          setCode(data.component.code);
          setTechnologies(
            data.component.technologies.map((tech: any) => tech.name)
          );
          setTags(data.component.tags.map((tag: any) => tag.name));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bir hata oluştu");
        console.error("Bileşen getirilirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      fetchComponent();
    }
  }, [componentId, session, status]);

  // Bileşeni güncelle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id || !componentId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/components/${componentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          code,
          technologies,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Bileşen güncellenirken bir hata oluştu"
        );
      }

      setSuccess("Bileşen başarıyla güncellendi");

      // 2 saniye sonra dashboard'a yönlendir
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Bileşen güncellenirken hata:", err);
    } finally {
      setSaving(false);
    }
  };

  // Teknoloji ekle
  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()]);
      setNewTechnology("");
    }
  };

  // Teknoloji kaldır
  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  // Etiket ekle
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Etiket kaldır
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Yükleniyor durumu
  if (loading) {
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

  // Bileşen bulunamadıysa
  if (!component) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Bileşen Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Düzenlemek istediğiniz bileşen bulunamadı veya erişim izniniz yok.
            <br />
            <span className="text-sm text-gray-500">
              Bileşen ID: {componentId}
            </span>
          </p>
          <div className="flex flex-col gap-4 items-center">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Dashboard'a Dön
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Yeniden Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bileşen sahibi değilse
  if (component.user.id !== session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Erişim Reddedildi
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Bu bileşeni düzenleme yetkiniz bulunmuyor.
          </p>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bileşeni Düzenle
          </h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            Dashboard'a Dön
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bileşen Adı
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kod
            </label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={10}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teknolojiler
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {technologies.map((tech) => (
                <div
                  key={tech}
                  className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => removeTechnology(tech)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                placeholder="Yeni teknoloji ekle"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addTechnology}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition">
                Ekle
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Etiketler
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Yeni etiket ekle"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition">
                Ekle
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
