  import { NextRequest, NextResponse } from "next/server";
  import { uploadImageToS3 } from "@/lib/s3";
  import { prisma } from "@/lib/db";
  import { auth } from "@/lib/auth";

  export async function POST(req: NextRequest) {
    try {
      const session = await auth();
      if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const productId = formData.get("productId") as string | null;
      const alt = formData.get("alt") as string | null;

      if (!file || !productId) {
        return NextResponse.json(
          { error: "File and productId are required" }, 
          { status: 400 }
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Upload to S3
      const imageUrl = await uploadImageToS3(buffer, file.type);

      // Create a new product image in the database
      const newImage = await prisma.productImage.create({
        data: {
          url: imageUrl,
          alt: alt || "Product Image",
          product: { connect: { id: productId } },
          position: 0 // Default position, can be updated later
        },
      });

      return NextResponse.json({ 
        success: true, 
        image: {
          id: newImage.id,
          url: newImage.url,
          alt: newImage.alt
        } 
      }, { status: 201 });
      
    } catch (error) {
      console.error("Upload failed:", error);
      return NextResponse.json(
        { error: "Upload failed. Please try again." }, 
        { status: 500 }
      );
    }
  }
