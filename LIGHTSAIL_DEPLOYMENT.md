# Amazon Lightsail Deployment

This project is ready to run on a Lightsail Ubuntu instance with Docker Compose.

## 1. Create the Lightsail server

Use an Ubuntu instance. Open these firewall ports in Lightsail:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS

Point your domain `A` record to the Lightsail static IP.

## 2. Install Docker on the server

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Log out and SSH back in after adding your user to the Docker group.

## 3. Upload the app

```bash
git clone YOUR_REPO_URL school-sms
cd school-sms
cp .env.production.example .env
```

Edit `.env` and replace every placeholder secret. For a same-domain deployment, use:

```bash
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://yourdomain.com/api/v1
VITE_UPLOAD_URL=https://yourdomain.com
```

Also replace `yourdomain.com` in `nginx-prod.conf`.

## 4. Add SSL certificates

Create the cert folder:

```bash
mkdir -p certs logs backup
```

For a quick first deployment, you can use Certbot on the host to issue certificates, then copy or symlink:

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/*.pem
```

## 5. Start production

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml ps
```

Check the app:

```bash
curl -I https://yourdomain.com/health
curl -I https://yourdomain.com/api/v1/health
```

## 6. Update later

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Notes

- Do not expose PostgreSQL or Redis publicly in the Lightsail firewall.
- Keep `.env`, `certs`, `logs`, and `backup` out of git.
- Take a Lightsail snapshot before major updates.
