import multer from "multer";

// Guardamos archivos temporalmente en /tmp
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
