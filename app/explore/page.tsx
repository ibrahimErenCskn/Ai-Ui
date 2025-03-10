"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Bileşen tipi tanımlaması
type Component = {
  id: string;
  name: string;
  description: string | null;
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

// Pagination tipi
type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function ExplorePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State tanımlamaları
  const [components, setComponents] = useState<Component[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre state'leri
  const [search, setSearch] = useState("");
  const [technology, setTechnology] = useState("");
  const [sort, setSort] = useState("newest");

  // Teknoloji listesi
  const [technologies, setTechnologies] = useState<string[]>([]);

  // URL'den parametreleri al
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page") as string)
    : 1;
  const searchQuery = searchParams.get("search") || "";
  const techFilter = searchParams.get("technology") || "";
  const sortOption = searchParams.get("sort") || "newest";

  // Bileşenleri getir
  const fetchComponents = async () => {
    try {
      setLoading(true);

      // API URL'ini oluştur
      let url = `/api/components?page=${page}&limit=${pagination.limit}`;

      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (technology) url += `&technology=${encodeURIComponent(technology)}`;
      if (sort) url += `&sort=${sort}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Bileşenler getirilirken bir hata oluştu");
      }

      const data = await response.json();
      setComponents(data.components);

      // API yanıtı yapısını kontrol et ve pagination bilgilerini güncelle
      if (data.pagination) {
        // Eski API yanıt yapısı
        setPagination(data.pagination);
      } else if (data.totalPages !== undefined) {
        // Yeni API yanıt yapısı
        setPagination({
          total: data.components.length * data.totalPages,
          page: data.currentPage || page,
          limit: pagination.limit,
          totalPages: data.totalPages,
        });
      } else {
        // Fallback
        setPagination({
          ...pagination,
          totalPages: Math.ceil(data.components.length / pagination.limit) || 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Bileşenler getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  // Teknolojileri getir
  const fetchTechnologies = async () => {
    try {
      const response = await fetch("/api/technologies");

      if (!response.ok) {
        throw new Error("Teknolojiler getirilirken bir hata oluştu");
      }

      const data = await response.json();
      setTechnologies(data.map((tech: { name: string }) => tech.name));
    } catch (err) {
      console.error("Teknolojiler getirilirken hata:", err);
    }
  };

  // Sayfa yüklendiğinde ve filtreler değiştiğinde bileşenleri getir
  useEffect(() => {
    fetchComponents();
  }, [page, search, technology, sort]);

  // Sayfa yüklendiğinde teknolojileri getir
  useEffect(() => {
    fetchTechnologies();
  }, []);

  // Arama işlemi
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/explore?search=${encodeURIComponent(
        search
      )}&technology=${technology}&sort=${sort}`
    );
  };

  // Filtre değişikliklerini uygula
  const applyFilters = () => {
    router.push(
      `/explore?search=${encodeURIComponent(
        search
      )}&technology=${encodeURIComponent(technology)}&sort=${sort}`
    );
  };

  // Sayfa değiştirme
  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    router.push(
      `/explore?page=${newPage}&search=${encodeURIComponent(
        search
      )}&technology=${encodeURIComponent(technology)}&sort=${sort}`
    );
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
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
              {session ? (
                <>
                  <Link
                    href="/create"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Oluştur
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
                </>
              ) : (
                <>
                  <Link
                    href="/docs"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Dokümantasyon
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                    Giriş Yap
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bileşenleri Keşfet</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Topluluk tarafından oluşturulan bileşenleri keşfedin ve kendi
            projelerinizde kullanın.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Bileşen ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={technology}
                onChange={(e) => {
                  setTechnology(e.target.value);
                  setTimeout(applyFilters, 100);
                }}>
                <option value="">Tüm Teknolojiler</option>
                {technologies.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setTimeout(applyFilters, 100);
                }}>
                <option value="newest">En Yeni</option>
                <option value="oldest">En Eski</option>
                <option value="popular">En Popüler</option>
                <option value="name">İsme Göre</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
                Ara
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Components Grid */}
        {!loading && !error && (
          <>
            {components.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Bileşen Bulunamadı</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Arama kriterlerinize uygun bileşen bulunamadı. Lütfen farklı
                  anahtar kelimeler deneyin veya filtreleri değiştirin.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-48 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center">
                      {component.previewUrl ? (
                        <Image
                          src={
                            "https://i.ytimg.com/vi/SJm5suVpOK0/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA_9hPF_pwjmTQ9m-EcR4RVs9WWPw"
                          }
                          alt={component.name}
                          width={300}
                          height={200}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-blue-600 dark:text-blue-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-lg">
                          {component.name}
                        </h3>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {component._count.likes}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        @
                        {component.user.username ||
                          component.user.name ||
                          "Kullanıcı"}{" "}
                        tarafından oluşturuldu
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {component.description || "Açıklama yok"}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {component.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {component.technologies.map((tech) => (
                            <span
                              key={tech.id}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {tech.name}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={`/component/${component.id}`}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                          Detaylar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === pagination.totalPages ||
                        Math.abs(p - pagination.page) <= 1
                    )
                    .map((p, i, arr) => {
                      // Sayfa numaraları arasında boşluk varsa "..." ekle
                      if (i > 0 && arr[i] - arr[i - 1] > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${p}`}>
                            <span className="px-2 text-gray-500 dark:text-gray-400">
                              ...
                            </span>
                            <button
                              className={`px-3 py-1 rounded-md ${
                                p === pagination.page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                              onClick={() => changePage(p)}>
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      }
                      return (
                        <button
                          key={p}
                          className={`px-3 py-1 rounded-md ${
                            p === pagination.page
                              ? "bg-blue-600 text-white"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => changePage(p)}>
                          {p}
                        </button>
                      );
                    })}

                  <button
                    className="p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
