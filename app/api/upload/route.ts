import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import path from "path";

const SERVICE_ACCOUNT_FILE = path.resolve("app/config/service-account.json");
const DRIVE_FOLDER_ID = "1DYJ7ig_dhQ7-6cPkHHfbo0reFeogeu6l"; // Replace with your Drive folder ID

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    const buffer = Buffer.from(
      imageBase64.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    const drive = google.drive({ version: "v3", auth });

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: `photo-${Date.now()}.png`,
        parents: [DRIVE_FOLDER_ID],
        mimeType: "image/png",
      },
      media: {
        mimeType: "image/png",
        body: bufferToStream(buffer),
      },
    });

    return NextResponse.json({ fileId: uploadResponse.data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
