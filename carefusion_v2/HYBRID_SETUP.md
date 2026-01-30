# Hybrid Deployment: Vercel Frontend + Local Machine Backend

This guide enables you to host the CareFusion website on Vercel while using your powerful local machine as the AI processing server.

## Phase 1: Expose your Local Machine to the Internet
Since your system is acting as the server, it needs a public URL.

1.  **Install Ngrok**: Download from [ngrok.com](https://ngrok.com).
2.  **Open a Tunnel**: In your terminal, run:
    ```bash
    ngrok http 5000
    ```
3.  **Get your Public URL**: Ngrok will give you a link like `https://a1b2-c3d4.ngrok-free.app`.
    *   **Keep this terminal open!** if you close it, the tunnel breaks.

## Phase 2: Deploy Frontend to Vercel
1.  **Push your code to GitHub**.
2.  **Connect to Vercel**:
    *   Root Directory: `carefusion_v2/frontend`
    *   Framework: `Vite`
3.  **Environment Variable**: 
    *   Add `VITE_API_BASE`
    *   Paste your Ngrok URL from Phase 1, followed by `/api/v2/ai`
    *   Example: `https://a1b2-c3d4.ngrok-free.app/api/v2/ai`
4.  **Deploy**.

## Phase 3: Access Anywhere
*   Your website is now at `care-fusion-ai.vercel.app` (or your custom domain).
*   When a doctor uploads an image or DNA file on their phone, the request travels:
    `Doctor's Phone` -> `Vercel` -> `Ngrok Tunnel` -> `YOUR LOCAL MACHINE`
*   Your local machine processes the AI and sends the result back to the phone.

## Important Notes
*   **Keep your system ON**: For the website to work, your computer must be running and the backend server started (`npm run dev` in the backend folder).
*   **Ngrok Static Domain**: (Optional) If you get a paid or free static domain from Ngrok, your URL won't change every time you restart it.
*   **Security**: Since `app.use(cors())` in `index.ts` is open, it will accept connections from your Vercel deployment automatically.

---
*Created by Antigravity AI - Your Clinical Platform is now Live.*
