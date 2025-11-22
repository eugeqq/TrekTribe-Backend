
import os from "os";
import app from "./app";

const PORT = Number(process.env.PORT) || 3000;

const interfaces = os.networkInterfaces();
let localIp: string | undefined;
for (const name of Object.keys(interfaces)) {
  const addrs = (interfaces as any)[name] || [];
  const ipv4 = addrs.find((i: any) => i.family === 'IPv4' && !i.internal);
  if (ipv4) {
    localIp = ipv4.address;
    break;
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor escuchando en http://${localIp || "localhost"}:${PORT}`);
});

