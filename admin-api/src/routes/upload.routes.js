import { Router } from "express";
import multer from "multer";
import { cloudinary } from "../lib/cloudinary.js";

const router = Router();

// Aceita até 8 arquivos, limite de 20MB por arquivo
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/**
 * Envia um buffer diretamente para o Cloudinary.
 * O Cloudinary faz a otimização nativamente (sem double-conversion).
 * quality:"auto:best" = melhor qualidade sem perda perceptível.
 */
function uploadBufferToCloudinary(buffer, originalName = "") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lumiere/products",
        resource_type: "image",
        format: "webp",
        quality: "auto:best",
        flags: "progressive",
        transformation: [
          {
            width: 1600,
            height: 1600,
            crop: "limit",       // nunca amplia, só reduz se necessário
            quality: "auto:best",
          },
        ],
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
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const uploads = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, file.originalname),
    );

    const results = await Promise.all(uploads);
    const urls = results.map((r) => r.secure_url);

    return res.status(201).json({ urls });
  } catch (error) {
    console.error("[upload] Erro:", error);
    return res
      .status(500)
      .json({ message: error.message || "Erro interno no upload." });
  }
});

export default router;
