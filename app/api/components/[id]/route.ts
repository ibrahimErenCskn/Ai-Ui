import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaInstance";
import { auth } from "@/auth";
import { ComponentStatus } from "@prisma/client";

// Bileşen detaylarını getirme (GET)
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const id = params.id;

    console.log("API: Bileşen getiriliyor, ID:", id);

    // Bileşeni getir
    const component = await prisma.component.findUnique({
      where: { id },
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    console.log("API: Bileşen bulundu mu:", !!component);

    if (!component) {
      return NextResponse.json(
        { error: `Bileşen bulunamadı. ID: ${id}` },
        { status: 404 }
      );
    }

    // Görüntülenme sayısını artır
    await prisma.component.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error("Bileşen getirilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Bileşen getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Bileşeni güncelleme (PATCH)
export async function PATCH(
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
    const id = params.id;
    const body = await request.json();

    // Bileşeni getir
    const component = await prisma.component.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    // Bileşen bulunamadıysa hata döndür
    if (!component) {
      return NextResponse.json(
        { error: "Bileşen bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcı bileşenin sahibi değilse hata döndür
    if (component.userId !== userId) {
      return NextResponse.json(
        { error: "Bu bileşeni düzenleme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Güncellenecek alanları hazırla
    const {
      name,
      description,
      code,
      technologies = [],
      tags = [],
      status,
    } = body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (code) updateData.code = code;
    if (status) {
      updateData.status = status as ComponentStatus;

      // Eğer bileşen ilk kez yayınlanıyorsa, yayınlanma tarihini ayarla
      if (status === "PUBLISHED" && component.status !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }
    if (body.previewUrl !== undefined) updateData.previewUrl = body.previewUrl;

    // Teknolojileri işle (varsa oluştur, yoksa bağla)
    let technologyConnections: { id: string }[] = [];
    if (technologies.length > 0) {
      technologyConnections = await Promise.all(
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
    }

    // Etiketleri işle (varsa oluştur, yoksa bağla)
    let tagConnections: { id: string }[] = [];
    if (tags.length > 0) {
      tagConnections = await Promise.all(
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
    }

    // Bileşeni güncelle
    const updatedComponent = await prisma.component.update({
      where: { id },
      data: {
        ...updateData,
        ...(technologies.length > 0 && {
          technologies: {
            set: [], // Önce mevcut teknolojileri temizle
            connect: technologyConnections, // Sonra yeni teknolojileri bağla
          },
        }),
        ...(tags.length > 0 && {
          tags: {
            set: [], // Önce mevcut etiketleri temizle
            connect: tagConnections, // Sonra yeni etiketleri bağla
          },
        }),
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

    return NextResponse.json({ component: updatedComponent });
  } catch (error) {
    console.error("Bileşen güncellenirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Bileşen güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Bileşeni silme (DELETE)
export async function DELETE(
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
    const id = params.id;

    // Bileşeni getir
    const component = await prisma.component.findUnique({
      where: { id },
      select: { userId: true },
    });

    // Bileşen bulunamadıysa hata döndür
    if (!component) {
      return NextResponse.json(
        { error: "Bileşen bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanıcı bileşenin sahibi değilse hata döndür
    if (component.userId !== userId) {
      return NextResponse.json(
        { error: "Bu bileşeni silme yetkiniz yok" },
        { status: 403 }
      );
    }

    // Bileşeni sil
    await prisma.component.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Bileşen başarıyla silindi" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bileşen silinirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Bileşen silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
