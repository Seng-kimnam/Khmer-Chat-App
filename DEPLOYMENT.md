# CI/CD & deployment

On every push to `main`, GitHub Actions:
1. Builds the backend and frontend Docker images
2. Pushes them to GitHub Container Registry (GHCR) — `ghcr.io/<you>/chat-app-backend` and `chat-app-frontend`
3. SSHes into your VPS, pulls the new images, and restarts the stack with `docker compose -f docker-compose.prod.yml up -d`

Workflow file: `.github/workflows/deploy.yml`.

## One-time setup

### 1. Make images pullable
GHCR images are private by default. Either:
- Make the packages public: repo → **Packages** tab → each package → **Package settings** → Change visibility → Public, or
- Keep them private and have the VPS `docker login ghcr.io` with a personal access token that has `read:packages` scope (the workflow already logs the VPS in during deploy, but if you ever pull manually on the server you'll need this too).

### 2. Add GitHub repo secrets
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret            | Value                                                        |
|--------------------|---------------------------------------------------------------|
| `SSH_HOST`         | Your VPS IP or hostname                                       |
| `SSH_USER`         | SSH user on the VPS (e.g. `deploy` or `ubuntu`)                |
| `SSH_PRIVATE_KEY`  | Private key matching a public key already in the VPS's `~/.ssh/authorized_keys` |
| `SSH_PORT`         | Usually `22`                                                   |
| `DEPLOY_PATH`      | Absolute path on the VPS where the repo/compose file lives, e.g. `/home/deploy/chat-app` |

### 3. Add GitHub repo variables (not secrets — these are public URLs, baked into the frontend build)
Repo → **Settings → Secrets and variables → Actions → Variables tab → New repository variable**:

| Variable                    | Value                              |
|------------------------------|--------------------------------------|
| `NEXT_PUBLIC_SOCKET_URL`      | `https://yourdomain.com` (or `:4000` if backend isn't behind a reverse proxy on the same domain) |
| `NEXT_PUBLIC_API_URL`         | same as above                        |

### 4. Prepare the VPS (once)
```bash
# On the VPS
mkdir -p /home/deploy/chat-app   # match DEPLOY_PATH secret
cd /home/deploy/chat-app

# Copy docker-compose.prod.yml there (scp it, or git clone the repo and just use that file)
# Then create the real .env from the example:
nano .env   # fill in DB_USER, DB_PASSWORD, DB_NAME, CORS_ORIGIN — see .env.prod.example
```

Also edit `docker-compose.prod.yml` on the server (or before committing) to replace
`YOUR_GITHUB_USERNAME` with your actual GitHub username/org — GHCR requires this
to be lowercase.

Make sure Docker + the Compose plugin are installed on the VPS:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out/in after this
```

### 5. First deploy
Push to `main`. Watch it run under the repo's **Actions** tab. Once green, check:
```bash
curl http://your-vps-ip:4000/chat/rooms
```

## What this does NOT do

- It doesn't run automated tests yet (there aren't any in this project). If you
  add a test suite later, add a `test` job before `build-and-push` and make
  `build-and-push` depend on it (`needs: test`) so broken code never reaches
  production.
- It doesn't handle TLS/HTTPS or a reverse proxy. For a real domain, put nginx
  or Caddy in front of ports 3000/4000 on the VPS (Caddy in particular makes
  HTTPS nearly zero-config).
- It always deploys `latest` — there's no manual approval step or rollback
  button. Good enough for a solo project; for anything more serious you'd add
  a `workflow_dispatch` trigger with an environment protection rule, or tag
  releases and deploy those instead of `main` directly.