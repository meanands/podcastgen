const DEFAULT_HOST = 'localhost';
const API_PORT = 3000;

export const config = {
    apiBaseUrl: `http://${process.env.NEXT_PUBLIC_SERVER_HOST || DEFAULT_HOST}:${API_PORT}`,
    wsBaseUrl: `ws://${process.env.NEXT_PUBLIC_SERVER_HOST || DEFAULT_HOST}:${API_PORT}`,
}; 