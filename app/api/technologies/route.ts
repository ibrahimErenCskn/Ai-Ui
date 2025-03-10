import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/prismaInstance";

// Teknolojileri listeleme (GET)
export async function GET(request: NextRequest) {
  try {
    // Tüm teknolojileri getir
    const technologies = await prisma.technology.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(technologies);
  } catch (error) {
    console.error("Teknolojiler getirilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Teknolojiler getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
