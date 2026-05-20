import net from 'net';

export async function assertPortAvailable(port: number, host = '0.0.0.0') {
  await new Promise<void>((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Stop the existing process or set API_PORT.`));
        return;
      }
      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve());
    });

    server.listen(port, host);
  });
}

