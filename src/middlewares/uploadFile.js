import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function uploadFile(folderName) {
 
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log("[DEBUG] Incoming file info:", {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
      });
      console.log("[DEBUG] Saving to:", path.join(__dirname, `../../public/assets/images/${folderName}`));
      cb(null, path.join(__dirname, `../../public/assets/images/${folderName}`));
    },
    filename: (req, file, cb) => {
      console.log("[DEBUG] filename() called for:", file.originalname);
      const newName = Date.now() + "-" + file.originalname;
      console.log("[DEBUG] New filename:", newName);
      cb(null, newName);
    },
  });

  const upload = multer({ storage });
  return upload;
}
