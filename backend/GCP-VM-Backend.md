# GCP VM Backend Setup — Command Reference

## Phase 1 — System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python, pip, nginx, and git
sudo apt install python3-pip python3-venv nginx git -y

# Verify installations
python3 --version && nginx -v && git --version
```

## Phase 2 — Python 3.11 Installation

```bash
# Install Python 3.11 (stable via deadsnakes PPA)
sudo apt install python3.11 python3.11-venv -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv -y

# Verify Python version
python3.11 --version
```

## Phase 3 — Clone Repo and Setup Virtual Environment

```bash
# Clone your GitHub repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Navigate into backend folder
cd YOUR_REPO_NAME/backend

# Create virtual environment using Python 3.11
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify Python version inside venv
python --version

# Install backend dependencies
pip install .
```

## Phase 4 — Test FastAPI

```bash
# Start uvicorn manually to test
uvicorn app.main:app --host 127.0.0.1 --port 8000

# In a second terminal, verify it responds
curl http://127.0.0.1:8000/openapi.json

# Stop uvicorn once verified
# CTRL + C
```

## Phase 5 — Setup systemd Service

```bash
# Create the service file
sudo nano /etc/systemd/system/finapp.service
```

Paste the following into the file — replace `YOUR_USERNAME` and `YOUR_REPO_NAME`:

```ini
[Unit]
Description=FinApp FastAPI Backend
After=network.target

[Service]
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/YOUR_REPO_NAME/backend
Environment="PATH=/home/YOUR_USERNAME/YOUR_REPO_NAME/backend/venv/bin"
ExecStart=/home/YOUR_USERNAME/YOUR_REPO_NAME/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Save with `CTRL+X` → `Y` → `Enter`

```bash
# Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable finapp
sudo systemctl start finapp

# Verify service is running
sudo systemctl status finapp

# Verify API is responding
curl http://127.0.0.1:8000/openapi.json
```

## Useful Service Management Commands

```bash
# Restart the service (e.g. after code changes)
sudo systemctl restart finapp

# Stop the service
sudo systemctl stop finapp

# View live logs
sudo journalctl -u finapp -f
```
