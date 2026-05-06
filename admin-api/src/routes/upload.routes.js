import { Router } from "express";
import multer from "multer";
import { cloudinary } from "../lib/cloudinary.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function uploadBufferToCloudinary(buffer, folder = "lumiere/products") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );
    stream.end(buffer);
  });
}

router.post("/", upload.array("files", 8), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }

  const sharp = (await import("sharp")).default;
  const urls = [];

  for (const file of req.files) {
    // Otimizacao: limita dimensao e converte para webp com qualidade balanceada.
    const optimizedBuffer = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();

    const uploaded = await uploadBufferToCloudinary(optimizedBuffer);
    urls.push(uploaded.secure_url);
  }

  return res.status(201).json({ urls });
});

export default router;
