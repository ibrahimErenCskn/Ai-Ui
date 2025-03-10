import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaInstance";
import { auth } from "@/auth";

// Bileşeni beğenme/beğeniyi kaldırma (POST)
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const params = await context.params;

    // Kullanıcı giriş yapmamışsa hata döndür
    if (!session?.user) {
      return NextResponse.json(
        { error: "Bu işlem için giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const componentId = params.id;

    // Bileşenin var olup olmadığını kontrol et
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    });

    if (!component) {
      return NextResponse.json(
        { error: "Bileşen bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcının bu bileşeni daha önce beğenip beğenmediğini kontrol et
    const existingLike = await prisma.like.findUnique({
      where: {
        componentId_userId: {
          componentId,
          userId,
        },
      },
    });

    let result;

    if (existingLike) {
      // Beğeniyi kaldır
      await prisma.like.delete({
        where: {
          componentId_userId: {
            componentId,
            userId,
          },
        },
      });

      result = { liked: false, message: "Beğeni kaldırıldı" };
    } else {
      // Beğeni ekle
      await prisma.like.create({
        data: {
          componentId,
          userId,
        },
      });

      result = { liked: true, message: "Bileşen beğenildi" };
    }

    // Beğeni sayısını getir
    const likeCount = await prisma.like.count({
      where: { componentId },
    });

    return NextResponse.json({
      ...result,
      likeCount,
    });
  } catch (error) {
    console.error("Beğeni işlemi sırasında hata oluştu:", error);
    return NextResponse.json(
      { error: "Beğeni işlemi sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Bileşenin beğeni durumunu kontrol etme (GET)
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await auth();
    const params = await context.params;
    const componentId = params.id;

    // Bileşenin var olup olmadığını kontrol et
    const component = await prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    });

    if (!component) {
      return NextResponse.json(
        { error: "Bileşen bulunamadı" },
        { status: 404 }
      );
    }

    // Beğeni sayısını getir
    const likeCount = await prisma.like.count({
      where: { componentId },
    });

    // Kullanıcı giriş yapmışsa, beğeni durumunu kontrol et
    let isLiked = false;
    if (session?.user) {
      const userId = session.user.id;
      const existingLike = await prisma.like.findUnique({
        where: {
          componentId_userId: {
            componentId,
            userId,
          },
        },
      });
      isLiked = !!existingLike;
    }

    return NextResponse.json({
      liked: isLiked,
      likeCount,
    });
  } catch (error) {
    console.error("Beğeni durumu kontrol edilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Beğeni durumu kontrol edilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
