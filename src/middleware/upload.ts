import multer from "multer";

// Guardamos archivos temporalmente en memoria
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
