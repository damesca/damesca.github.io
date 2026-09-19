# CV website (Jekyll + GitHub Pages)

A single-page academic CV, built with [Jekyll](https://jekyllrb.com/) and hosted
on GitHub Pages. **You edit YAML data files, not HTML.**

---

## 1. Editing your content

All content lives in the `_data/` folder — plain [YAML](https://learnxinyminutes.com/docs/yaml/)
files. Change the values, save, and the page updates.

| File | What it holds |
|------|---------------|
| `_data/profile.yml`      | Name, title, bio, contact links, CV-PDF path |
| `_data/interests.yml`    | Research-interest tags |
| `_data/publications.yml` | Papers (title, authors, venue, year, links) |
| `_data/experience.yml`   | Jobs / positions |
| `_data/education.yml`    | Degrees |
| `_data/talks.yml`        | Invited talks |
| `_data/awards.yml`       | Honors & awards |
| `_data/service.yml`      | PC memberships, reviewing, teaching |
| `_data/skills.yml`       | Grouped skills |

Site-wide settings (your title, URL, `baseurl`) are in `_config.yml`.

**Tips**
- Your own name (set as `me:` in `profile.yml`) is automatically **bolded** in
  publication author lists.
- To hide a whole section, empty its data file (e.g. set the file's content to `[]`).
- Any link field left as `""` is simply omitted.
- Replace `assets/cv.pdf` with your real CV PDF, and `assets/favicon.svg` if you like.
- YAML is indentation-sensitive: use **spaces, not tabs**, and keep the `- ` list markers aligned.

---

## 2. Preview locally (Docker — no Ruby install needed)

You have Docker installed, so this is the simplest path:

```bash
cd gh-cv
docker compose up          # first run downloads the image + installs gems (~2 min)
```

Open **http://localhost:4000/gh-cv/** in your browser.

- The page **live-reloads** when you edit a `_data/*.yml` file or the CSS.
- **Exception:** changes to `_config.yml` require a restart — press `Ctrl+C`, then
  `docker compose up` again.
- Stop with `Ctrl+C`; run `docker compose down` to remove the container.

To reproduce the exact production build locally:

```bash
docker compose exec jekyll bundle exec jekyll build
```

<details>
<summary>Alternative: WSL or native Windows Ruby</summary>

**WSL (Ubuntu):**
```bash
sudo apt update && sudo apt install -y ruby-full build-essential zlib1g-dev
gem install --user-install bundler
bundle install
bundle exec jekyll serve --livereload
```

**Native Windows:** install Ruby+DevKit with
`winget install RubyInstallerTeam.RubyWithDevKit.3.3`, reopen the terminal, then
`bundle install` and `bundle exec jekyll serve --livereload`.
</details>

---

## 3. Publish on GitHub Pages

1. Create a repository and push this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial CV site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/gh-cv.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) builds and deploys on every
   push to `main`. Watch progress under the **Actions** tab.
4. Your site goes live at **https://<your-username>.github.io/gh-cv/**.

### URL / `baseurl` note
- Repo named **`gh-cv`** → served at `…github.io/gh-cv/`. Keep `baseurl: "/gh-cv"`
  in `_config.yml`. (The Actions build sets the correct path automatically; the
  `baseurl` value mainly affects your *local* preview URL.)
- Want a bare **`https://<your-username>.github.io/`**? Rename the repo to
  `<your-username>.github.io` and set `baseurl: ""` in `_config.yml`.

---

## 4. Exporting a PDF

Open the live site, press **Ctrl/Cmd + P**, and choose *Save as PDF*. A dedicated
print stylesheet strips navigation/colors for a clean document. Save it as
`assets/cv.pdf` to offer it as a download from the header.

---

## Project layout

```
_config.yml           site settings
Gemfile               Ruby dependencies (Jekyll 4.x)
docker-compose.yml    local preview server
index.md              the page (renders from _data)
_layouts/default.html page structure (rarely edited)
_includes/            reusable snippets (head, link row)
_data/                YOUR CONTENT lives here
assets/               css, favicon, cv.pdf
.github/workflows/    GitHub Pages deploy
```
