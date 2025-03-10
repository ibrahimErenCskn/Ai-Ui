import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaInstance";
import { auth } from "@/auth";
import { ComponentStatus } from "@prisma/client";

// Bileşenleri listeleme (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PUBLISHED";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const technology = searchParams.get("technology");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "newest";
    const userId = searchParams.get("userId");
    const random = searchParams.get("random") === "true";

    // Sayfalama için hesaplamalar
    const skip = (page - 1) * limit;

    // Filtreleme koşulları
    const where: any = {};

    // Status filtresi (ALL değilse)
    if (status !== "ALL") {
      where.status = status;
    }

    // Arama filtresi
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Kullanıcı filtresi
    if (userId) {
      where.userId = userId;
    }

    // Teknoloji filtresi
    if (technology) {
      where.technologies = {
        some: {
          name: technology,
        },
      };
    }

    // Etiket filtresi
    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      };
    }

    // Sıralama seçenekleri
    let orderBy: any = {};

    // Rastgele sıralama
    if (random) {
      // Prisma'da doğrudan random sıralama olmadığı için
      // Tüm bileşenleri getirip JavaScript'te karıştıracağız
      orderBy = {}; // Varsayılan sıralama
    } else {
      switch (sort) {
        case "newest":
          orderBy = { createdAt: "desc" };
          break;
        case "oldest":
          orderBy = { createdAt: "asc" };
          break;
        case "popular":
          orderBy = { viewCount: "desc" };
          break;
        case "name":
          orderBy = { name: "asc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
      }
    }

    // Bileşenleri getir
    let components = await prisma.component.findMany({
      where,
      orderBy,
      skip: random ? 0 : skip, // Rastgele ise skip kullanma
      take: random ? 50 : limit, // Rastgele ise daha fazla al, sonra karıştır ve limit kadar döndür
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        technologies: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Toplam bileşen sayısını getir
    const totalComponents = await prisma.component.count({ where });

    // Rastgele sıralama
    if (random) {
      // Fisher-Yates algoritması ile diziyi karıştır
      for (let i = components.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [components[i], components[j]] = [components[j], components[i]];
      }

      // Limit kadar döndür
      components = components.slice(0, limit);
    }

    return NextResponse.json({
      components,
      totalPages: Math.ceil(totalComponents / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Bileşenler getirilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Bileşenler getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yeni bileşen oluşturma (POST)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Kullanıcı giriş yapmamışsa hata döndür
    if (!session?.user) {
      return NextResponse.json(
        { error: "Bu işlem için giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Gerekli alanları kontrol et
    const { name, description, code, technologies = [], tags = [] } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Bileşen adı ve kodu zorunludur" },
        { status: 400 }
      );
    }

    // Teknolojileri işle (varsa oluştur, yoksa bağla)
    const technologyConnections = await Promise.all(
      technologies.map(async (tech: string) => {
        const existingTech = await prisma.technology.findUnique({
          where: { name: tech },
        });

        if (existingTech) {
          return { id: existingTech.id };
        } else {
          const newTech = await prisma.technology.create({
            data: { name: tech },
          });
          return { id: newTech.id };
        }
      })
    );

    // Etiketleri işle (varsa oluştur, yoksa bağla)
    const tagConnections = await Promise.all(
      tags.map(async (tag: string) => {
        const existingTag = await prisma.tag.findUnique({
          where: { name: tag },
        });

        if (existingTag) {
          return { id: existingTag.id };
        } else {
          const newTag = await prisma.tag.create({
            data: { name: tag },
          });
          return { id: newTag.id };
        }
      })
    );

    // Bileşeni oluştur
    const component = await prisma.component.create({
      data: {
        name,
        description,
        code,
        previewUrl: body.previewUrl,
        status: body.status || "DRAFT",
        userId,
        technologies: {
          connect: technologyConnections,
        },
        tags: {
          connect: tagConnections,
        },
        publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        technologies: true,
        tags: true,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error("Bileşen oluşturulurken hata oluştu:", error);
    return NextResponse.json(
      { error: "Bileşen oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
