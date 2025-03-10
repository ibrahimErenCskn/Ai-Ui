"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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

// Dashboard istatistikleri tipi
type DashboardStats = {
  totalComponents: number;
  totalViews: number;
  totalLikes: number;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State tanımlamaları
  const [components, setComponents] = useState<Component[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalComponents: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  // Menüyü aç/kapat
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Durum menüsünü aç/kapat
  const toggleStatusMenu = (componentId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (activeStatusMenu === componentId) {
      setActiveStatusMenu(null);
    } else {
      const buttonRect = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      setStatusMenuPosition({
        top: buttonRect.bottom + window.scrollY,
        left: buttonRect.left + window.scrollX,
      });
      setActiveStatusMenu(componentId);
    }
  };

  // Menü dışına tıklandığında menüleri kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container") && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (!target.closest(".status-menu-container") && activeStatusMenu) {
        setActiveStatusMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, activeStatusMenu]);

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Kullanıcının bileşenlerini getir
  const fetchUserComponents = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // API URL'ini oluştur - sadece kullanıcının kendi bileşenlerini getir
      const response = await fetch(
        `/api/components?userId=${session.user.id}&status=ALL`
      );

      if (!response.ok) {
        throw new Error("Bileşenler getirilirken bir hata oluştu");
      }

      const data = await response.json();
      setComponents(data.components);

      // İstatistikleri hesapla
      const totalViews = data.components.reduce(
        (sum: number, comp: Component) => sum + comp.viewCount,
        0
      );
      const totalLikes = data.components.reduce(
        (sum: number, comp: Component) => sum + comp._count.likes,
        0
      );

      setStats({
        totalComponents: data.components.length,
        totalViews,
        totalLikes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      console.error("Bileşenler getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  // Bileşen durumunu güncelle (yayınla/taslak/arşivle)
  const updateComponentStatus = async (
    componentId: string,
    newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ) => {
    try {
      const response = await fetch(`/api/components/${componentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Bileşen durumu güncellenirken bir hata oluştu");
      }

      // Bileşenleri yeniden getir
      fetchUserComponents();
    } catch (err) {
      console.error("Bileşen durumu güncellenirken hata:", err);
      alert("Bileşen durumu güncellenirken bir hata oluştu");
    }
  };

  // Bileşeni sil
  const deleteComponent = async (componentId: string) => {
    if (!confirm("Bu bileşeni silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/components/${componentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Bileşen silinirken bir hata oluştu");
      }

      // Bileşenleri yeniden getir
      fetchUserComponents();
    } catch (err) {
      console.error("Bileşen silinirken hata:", err);
      alert("Bileşen silinirken bir hata oluştu");
    }
  };

  // Sayfa yüklendiğinde bileşenleri getir
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserComponents();
    }
  }, [session]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Yükleniyor durumu
  if (
    status === "loading" ||
    (status === "authenticated" && loading && !components.length)
  ) {
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

  // Tarih formatla
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  // Durum etiketi
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = "";
    let textColor = "";
    let label = "";

    switch (status) {
      case "PUBLISHED":
        bgColor = "bg-green-100 dark:bg-green-900";
        textColor = "text-green-800 dark:text-green-300";
        label = "Yayında";
        break;
      case "DRAFT":
        bgColor = "bg-yellow-100 dark:bg-yellow-900";
        textColor = "text-yellow-800 dark:text-yellow-300";
        label = "Taslak";
        break;
      case "ARCHIVED":
        bgColor = "bg-gray-100 dark:bg-gray-700";
        textColor = "text-gray-800 dark:text-gray-300";
        label = "Arşivlenmiş";
        break;
    }

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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
                href="/create"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Oluştur
              </Link>
              <div className="relative user-menu-container">
                <button
                  onClick={toggleMenu}
                  className="flex items-center gap-2 focus:outline-none cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="text-gray-800 dark:text-gray-200 cursor-pointer">
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
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hoş Geldiniz, {session?.user?.name?.split(" ")[0] || "Kullanıcı"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kontrol panelinizden bileşenlerinizi yönetebilir ve yeni bileşenler
            oluşturabilirsiniz.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Toplam Bileşen</h2>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalComponents}</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Oluşturduğunuz toplam bileşen sayısı
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Toplam Görüntülenme</h2>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalViews}</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Bileşenlerinizin toplam görüntülenme sayısı
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Toplam Beğeni</h2>
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-600 dark:text-red-400"
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
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.totalLikes}</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Bileşenlerinizin toplam beğeni sayısı
            </p>
          </div>
        </div>

        {/* Components Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Bileşenleriniz</h2>
            <Link
              href="/create"
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors inline-flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Yeni Bileşen
            </Link>
          </div>

          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Bileşenler yükleniyor...
              </p>
            </div>
          )}

          {!loading && components.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz hiç bileşen oluşturmadınız.
              </p>
              <Link
                href="/create"
                className="mt-4 inline-block px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                İlk Bileşeninizi Oluşturun
              </Link>
            </div>
          )}

          {!loading && components.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                      Bileşen
                    </th>
                    <th className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px]">
                      Oluşturulma Tarihi
                    </th>
                    <th className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                      Durum
                    </th>
                    <th className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                      Görüntülenme
                    </th>
                    <th className="cursor-pointer px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]">
                      Beğeni
                    </th>
                    <th className="cursor-pointer px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {components.map((component) => (
                    <tr
                      key={component.id}
                      className="hover:bg-gray-500/5  dark:hover:bg-gray-750">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {component.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(component.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={component.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {component.viewCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {component._count.likes}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={
                              component.id ? `/component/${component.id}` : "#"
                            }
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            Görüntüle
                          </Link>
                          <Link
                            href={
                              component.id
                                ? `/component/${component.id}/edit`
                                : "#"
                            }
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                            Düzenle
                          </Link>
                          <div className="relative status-menu-container">
                            <button
                              onClick={(event) =>
                                toggleStatusMenu(component.id, event)
                              }
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 relative z-10">
                              Durum
                            </button>
                            {activeStatusMenu === component.id && (
                              <div
                                className="fixed w-40 bg-white dark:bg-gray-800 rounded-md shadow-xl border-2 border-gray-200 dark:border-gray-700 z-50"
                                style={{
                                  top: `${statusMenuPosition.top}px`,
                                  left: `${statusMenuPosition.left}px`,
                                }}>
                                <div className="py-1">
                                  <button
                                    onClick={() =>
                                      component.id &&
                                      updateComponentStatus(
                                        component.id,
                                        "PUBLISHED"
                                      )
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                                    disabled={component.status === "PUBLISHED"}>
                                    Yayınla
                                  </button>
                                  <button
                                    onClick={() =>
                                      component.id &&
                                      updateComponentStatus(
                                        component.id,
                                        "DRAFT"
                                      )
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                                    disabled={component.status === "DRAFT"}>
                                    Taslak
                                  </button>
                                  <button
                                    onClick={() =>
                                      component.id &&
                                      updateComponentStatus(
                                        component.id,
                                        "ARCHIVED"
                                      )
                                    }
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                                    disabled={component.status === "ARCHIVED"}>
                                    Arşivle
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              component.id && deleteComponent(component.id)
                            }
                            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} AI-UI. Tüm hakları saklıdır.
              </p>
            </div>
            <div className="flex gap-6">
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                Hakkımızda
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
