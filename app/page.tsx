"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

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

// Kod yazma animasyonu için bileşen
const CodeTypingAnimation = () => {
  const [displayedCode, setDisplayedCode] = useState("");
  const [currentLine, setCurrentLine] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  const codeLines = [
    '<span class="text-blue-400">function</span> <span class="text-green-400">GradientButton</span>(<span class="text-orange-400">props</span>) {',
    '  <span class="text-blue-400">const</span> { label, onClick, variant = <span class="text-yellow-400">\'primary\'</span> } = props;',
    "",
    '  <span class="text-blue-400">return</span> (',
    '    &lt;<span class="text-red-400">button</span>',
    '      <span class="text-purple-400">className</span>=<span class="text-yellow-400">{`</span>',
    "        px-6 py-3 rounded-full font-medium transition-all duration-300",
    "        transform hover:scale-105 hover:shadow-lg",
    "        ${variant === <span class=\"text-yellow-400\">'primary'</span> ? <span class=\"text-yellow-400\">'bg-gradient-to-r from-blue-600 to-violet-600 text-white'</span> : <span class=\"text-yellow-400\">'bg-white text-gray-800 border border-gray-200'</span>}",
    '      <span class="text-yellow-400">`}</span>',
    '      <span class="text-purple-400">onClick</span>={onClick}',
    "    &gt;",
    "      {label}",
    '    &lt;/<span class="text-red-400">button</span>&gt;',
    "  );",
    "}",
  ];

  useEffect(() => {
    if (!isTyping) return;

    if (currentLine < codeLines.length) {
      const timer = setTimeout(() => {
        setDisplayedCode(
          (prev) => prev + (prev ? "<br>" : "") + codeLines[currentLine]
        );
        setCurrentLine((prev) => prev + 1);
      }, Math.random() * 200 + 100); // Rastgele yazma hızı

      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);

      // Bir süre sonra tekrar başlat
      const resetTimer = setTimeout(() => {
        setDisplayedCode("");
        setCurrentLine(0);
        setIsTyping(true);
      }, 5000);

      return () => clearTimeout(resetTimer);
    }
  }, [currentLine, isTyping]);

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-400">AI-UI Bileşen Oluşturucu</div>
        <div></div>
      </div>
      <div className="p-4 font-mono text-sm text-gray-200 overflow-hidden h-[300px] overflow-y-auto">
        <div
          className="code-typing-container"
          dangerouslySetInnerHTML={{ __html: displayedCode }}
        />
        <div className={`cursor ${isTyping ? "blinking" : "hidden"}`}>_</div>
      </div>
    </div>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const [latestComponents, setLatestComponents] = useState<Component[]>([]);
  const [randomComponents, setRandomComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(true);

  // En son üretilen 5 bileşeni getir
  useEffect(() => {
    const fetchLatestComponents = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/components?limit=5&sort=newest");

        if (!response.ok) {
          throw new Error("Bileşenler getirilirken bir hata oluştu");
        }

        const data = await response.json();
        setLatestComponents(data.components);
      } catch (error) {
        console.error("Bileşenler getirilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestComponents();
  }, []);

  // Rastgele 6 bileşen getir
  useEffect(() => {
    const fetchRandomComponents = async () => {
      try {
        setRandomLoading(true);
        const response = await fetch("/api/components?limit=6&random=true");

        if (!response.ok) {
          throw new Error("Rastgele bileşenler getirilirken bir hata oluştu");
        }

        const data = await response.json();
        setRandomComponents(data.components);
      } catch (error) {
        console.error("Rastgele bileşenler getirilirken hata:", error);
      } finally {
        setRandomLoading(false);
      }
    };

    fetchRandomComponents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex justify-between items-center h-20">
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
                href="/docs"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Dokümantasyon
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                  Dashboard
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

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
              AI-UI: Yapay Zeka ile UI Geliştirme Platformu
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Yapay zeka ile React bileşenleri tasarlayın, geliştirin ve
              toplulukla paylaşın. Kodlama deneyiminizi yapay zeka ile bir üst
              seviyeye taşıyın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create"
                className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                Bileşen Oluştur
              </Link>
              <Link
                href="/explore"
                className="px-8 py-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium transition-colors">
                Keşfet
              </Link>
            </div>
          </div>

          {/* Feature Preview */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"></div>
            <div className="relative p-2 bg-white dark:bg-gray-900 rounded-xl">
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <div className="w-full max-w-2xl p-4">
                  <CodeTypingAnimation />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Neler Yapabilirsiniz?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
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
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI ile Tasarım</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Metin açıklamanızı AI'ya verin ve anında çalışan React
                bileşenleri oluşturun. Karmaşık UI'ları dakikalar içinde
                tasarlayın.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Kod Düzenleme</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Oluşturulan bileşenleri düzenleyin, özelleştirin ve kendi
                ihtiyaçlarınıza göre uyarlayın. Tam kontrol sizde.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Toplulukla Paylaşım
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Oluşturduğunuz bileşenleri toplulukla paylaşın, başkalarının
                çalışmalarından ilham alın ve birlikte büyüyün.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* En Son Üretilen Bileşenler */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              En Son Üretilen Bileşenler
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Topluluğumuzun en son oluşturduğu UI bileşenlerini keşfedin ve
              projelerinizde kullanın.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestComponents.map((component) => (
                <div
                  key={component.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {component.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {component.description ||
                        "Bu bileşen için açıklama bulunmuyor."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {component.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech.id}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {tech.name}
                        </span>
                      ))}
                      {component.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                          +{component.technologies.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {component.user.image ? (
                          <Image
                            src={component.user.image}
                            alt={component.user.name || "Kullanıcı"}
                            width={24}
                            height={24}
                            className="rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full mr-2"></div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {component.user.name ||
                            component.user.username ||
                            "Anonim"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-500">
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {component.viewCount}
                        </span>
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-500">
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
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/component/${component.id}`}
                        className="w-full block text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                        Görüntüle
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/explore"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Tüm Bileşenleri Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* Topluluk Tarafından Oluşturulan Bileşenler */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Topluluk Tarafından Oluşturulan Bileşenler
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Topluluğumuzun oluşturduğu çeşitli UI bileşenlerini keşfedin ve
              projelerinizde kullanın.
            </p>
          </div>

          {randomLoading ? (
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {randomComponents.map((component) => (
                <div
                  key={component.id}
                  className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {component.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {component.description ||
                        "Bu bileşen için açıklama bulunmuyor."}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {component.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech.id}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {tech.name}
                        </span>
                      ))}
                      {component.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                          +{component.technologies.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {component.user.image ? (
                          <Image
                            src={component.user.image}
                            alt={component.user.name || "Kullanıcı"}
                            width={24}
                            height={24}
                            className="rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full mr-2"></div>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {component.user.name ||
                            component.user.username ||
                            "Anonim"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-500">
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          {component.viewCount}
                        </span>
                        <span className="flex items-center text-sm text-gray-500 dark:text-gray-500">
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
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/component/${component.id}`}
                        className="w-full block text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                        Görüntüle
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/explore"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Tüm Bileşenleri Keşfet
            </Link>
          </div>
        </div>
      </section>

      {/* Yapay Zeka ile Bileşen Oluşturma */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Yapay Zeka ile Bileşen Oluşturun
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Artık sadece bir prompt yazarak istediğiniz UI bileşenini
                saniyeler içinde oluşturabilirsiniz. Yapay zeka teknolojimiz,
                isteğinizi anlar ve seçtiğiniz teknolojilere uygun çalışan bir
                kod üretir.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    İstediğiniz bileşeni doğal dilde tanımlayın
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    React, Tailwind CSS ve TypeScript desteği
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    Saniyeler içinde çalışan kod elde edin
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">
                    Kodu düzenleyin ve topluluğa paylaşın
                  </span>
                </li>
              </ul>
              <Link
                href="/create"
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center">
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
                Hemen Deneyin
              </Link>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-gray-500">AI-UI Prompt</div>
              </div>
              <div className="mb-4">
                <div className="bg-white dark:bg-gray-900 p-3 rounded-md mb-2 text-gray-700 dark:text-gray-300 text-sm">
                  <span className="text-purple-600 dark:text-purple-400">
                    {">"}
                  </span>{" "}
                  Hover durumunda büyüyen, gradient arka plana sahip bir buton
                  bileşeni oluştur
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-200 text-sm font-mono">
                  <div className="text-blue-600 dark:text-blue-400">import</div>{" "}
                  React{" "}
                  <div className="text-blue-600 dark:text-blue-400">from</div>{" "}
                  <span className="text-green-600 dark:text-green-400">
                    'react'
                  </span>
                  ;
                  <br />
                  <br />
                  <div className="text-blue-600 dark:text-blue-400">
                    const
                  </div>{" "}
                  GradientButton ={" "}
                  {"({ label, onClick, variant = 'primary' }) => {"}
                  <br />
                  &nbsp;&nbsp;
                  <div className="text-blue-600 dark:text-blue-400">
                    return
                  </div>{" "}
                  (
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{"<button"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"className={`"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {
                    "px-6 py-3 rounded-full font-medium transition-all duration-300"
                  }
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {"transform hover:scale-105 hover:shadow-lg"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {
                    "${variant === 'primary' ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}"
                  }
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"`}"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"onClick={onClick}"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{">"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{label}"}
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{"</button>"}
                  <br />
                  &nbsp;&nbsp;);
                  <br />
                  {"};"}
                  <br />
                  <br />
                  <div className="text-blue-600 dark:text-blue-400">
                    export default
                  </div>{" "}
                  GradientButton;
                </div>
              </div>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Saniyeler içinde çalışan kod elde edin
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Hemen Başlayın</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              AI destekli UI geliştirme deneyimini keşfedin ve kendi
              bileşenlerinizi oluşturmaya başlayın.
            </p>
            <Link
              href="/create"
              className="px-8 py-3 rounded-full bg-white text-blue-600 hover:bg-gray-100 font-medium transition-colors inline-block">
              İlk Bileşeninizi Oluşturun
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-blue-600">AI-UI</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Yapay zeka ile UI geliştirme platformu
              </p>
            </div>
            <div className="flex gap-8">
              <Link
                href="/about"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Hakkımızda
              </Link>
              <Link
                href="/docs"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Dokümantasyon
              </Link>
              <Link
                href="/blog"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Blog
              </Link>
              <Link
                href="/contact"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                İletişim
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} AI-UI. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
