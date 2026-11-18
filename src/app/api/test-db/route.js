import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to MongoDB Atlas!",
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed.",
      },
      { status: 500 },
    );
  }
}
