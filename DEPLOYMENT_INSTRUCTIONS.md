# Deployment Instructions

## Quick Setup Steps

### 1. Create Repository on GitHub
1. Visit: https://github.com/new
2. Repository name: `dag-assignment`
3. Choose Public or Private
4. **DO NOT** check "Initialize with README"
5. Click "Create repository"

### 2. Authenticate Git

#### Method A: Personal Access Token (Easiest)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "dag-assignment-deploy"
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

Then run:
```bash
git push -u origin main
```
When prompted for username: enter `pvkacode`
When prompted for password: paste the token (not your GitHub password)

#### Method B: GitHub CLI
```bash
# Install GitHub CLI if needed
# Then authenticate
gh auth login
# Follow prompts, choose GitHub.com and HTTPS
# Then push
git push -u origin main
```

#### Method C: SSH (If you have SSH keys set up)
```bash
git remote set-url origin git@github.com:pvkacode/dag-assignment.git
git push -u origin main
```

### 3. Verify Deployment
After successful push, visit:
https://github.com/pvkacode/dag-assignment

---

## Current Status
✅ Git repository initialized  
✅ Initial commit created  
✅ Remote configured: https://github.com/pvkacode/dag-assignment.git  
⏳ **Waiting for**: Repository creation + authentication

---

## Alternative: Use GitHub Desktop
If command line is problematic, you can:
1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. File → Add Local Repository
4. Select this folder
5. Click "Publish repository"
