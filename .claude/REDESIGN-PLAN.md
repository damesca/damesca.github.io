# Rediseño de la web-CV en pirámide invertida

## Contexto

`C:\Users\dmora\Desktop\gh-cv` es un CV personal en Jekyll 4.x (sin tema, una sola
página) que se despliega a https://damesca.github.io/ vía GitHub Actions. Hoy el
layout `_layouts/default.html` imprime **todas** las secciones del CV una detrás de
otra: quien entra tiene que hacer scroll por nueve secciones antes de saber quién eres
y qué has publicado.

El público objetivo (comités de contratación, colegas académicos, gente de
conferencias) decide en segundos si sigue leyendo, y lo primero que busca son
publicaciones y perfiles académicos. El objetivo es reorganizar la misma información
en tres bloques —encabezado compacto / dos columnas con lo esencial / CV completo
desplegable— sin perder nada de contenido y sin añadir dependencias.

La Fase 1 del documento de especificación **ya está hecha**: todo el contenido vive en
`_data/*.yml` (9 ficheros) y `_layouts/default.html` no tiene ni un dato escrito a
mano. El trabajo real empieza en la Fase 2.

Decisiones ya tomadas con el propietario:

| Decisión | Elección |
|---|---|
| Sección de Proyectos | Crear `_data/projects.yml` **vacío** con plantilla comentada; la sección se oculta mientras no haya entradas |
| Destacados | 5 publicaciones: Cavefish (1), ZK Bitcoin Mixer (2), Dynamic Secret Sharing (3), Confidential Computations (4), PSI review (5) |
| Publicaciones en el CV completo | **Dos** desplegables: `International Publications (8)` abierto, `National Publications (3)` cerrado |
| Modo oscuro | Automático (`prefers-color-scheme`) **+ botón** de alternar con `localStorage` |
| Idioma | Inglés en la web; nombres de campos YAML en inglés para ser coherentes con los existentes |

### Principio rector: nada se borra

Cada paso **añade** ficheros; los antiguos se quedan intactos hasta el último paso.
En concreto, el nuevo diseño se construye en un layout nuevo (`_layouts/cv.html`) y se
previsualiza en una página nueva (`preview.md` → `/preview/`), de modo que
`/` sigue mostrando la web actual mientras se trabaja. `index.md` solo cambia de layout
en el Paso 7. `_layouts/default.html`, `_includes/icon-links.html` y
`assets/css/style.css` no se eliminan en ningún momento.

---

## Paso 0 — Guardar el plan en el repo

Copiar este plan a `.claude/REDESIGN-PLAN.md` en el repositorio para que quede
versionado junto al código y sirva de referencia en sesiones futuras.

---

## Paso 1 — Capa de datos (solo añadir campos)

Nada de este paso cambia la web; solo enriquece los YAML. La web actual sigue
renderizando igual porque los campos nuevos se ignoran.

**`_data/publications.yml`** y **`_data/publications_national.yml`** — añadir a cada
entrada un `id` (slug único, usado como ancla `#id`):

```yaml
- id: cavefish-light-client-2026
  title: "Cavefish: Communication-Optimal Light Client Protocol for UTxO Ledgers"
  authors: "Aggelos Kiayias, Marc Roeschlink, Polina Vinogradova, Daniel Morales, Pyrros Chaidos"
  venue: "eprint"
  year: 2026
  links:
    eprint: "https://eprint.iacr.org/2026/217"
  featured: true
  featured_order: 1
  card_summary: "Light client for UTxO ledgers with communication-optimal proofs."
```

Slugs propuestos (estables, no cambiarlos después: son URLs compartibles):

- `cavefish-light-client-2026` — featured_order 1
- `zk-bitcoin-mixer-2025` — featured_order 2
- `dynamic-secret-sharing-iot-2025` — featured_order 3
- `confidential-computations-blockchain-2024` — featured_order 4
- `private-set-intersection-review-2023` — featured_order 5
- `mpc-besu-private-transactions-2023`, `crowd-counting-ephemeral-ids-2022`
- nacionales: `eip712-offchain-oracles-2026`, `confidential-computations-jitel-2023`,
  `mpc-ca-poc-jitel-2019`

`card_summary` (una frase) solo es necesario en las 5 destacadas; lo redacto a partir
del título y lo revisas.

**`_data/projects.yml`** (nuevo, sin entradas) — plantilla comentada siguiendo el
estilo del resto de ficheros de `_data/`:

```yaml
# ============================================================================
#  Projects / implementations.  Newest first.
#  While this file has no entries the whole section stays hidden.
#    id, name, description (required); year, technologies, links, featured,
#    featured_order, card_summary (optional).
# ============================================================================
#
# - id: my-project
#   name: "..."
#   description: "..."
#   technologies: [Rust, Python]
#   year: 2025
#   links:
#     repo: "..."
#     demo: "..."
#   featured: true
#   featured_order: 6
#   card_summary: "..."
```

**`_data/profile.yml`** — añadir dos campos opcionales vacíos para completar el
encabezado sin inventarme URLs: `dblp` y `eprint` ya existen comentados; los dejo
comentados con una nota de que al rellenarlos aparece el icono automáticamente.

---

## Paso 2 — Layout nuevo e includes (generados desde los YAML)

Crear **`_layouts/cv.html`** con los tres bloques, y **`preview.md`** con
`layout: cv` + `permalink: /preview/` para verlo sin tocar la home.

Estructura semántica:

```
<header class="hero">            → _includes/hero.html
<main>
  <section class="top-grid">     → _includes/intro.html  +  _includes/featured.html
  <section id="cv-full">         → _includes/cv-full.html
</main>
<footer>
```

Includes nuevos (todos leen de `site.data.*`, cero datos a mano):

| Fichero | Contenido |
|---|---|
| `_includes/hero.html` | foto (`p.photo`), `h1` nombre, línea de posición (`p.title`), `p.location`, fila de iconos, botón «Download CV (PDF)» si `p.cv_pdf`, botón de tema |
| `_includes/icon-links-svg.html` | fila de enlaces con **SVG inline** (email, Scholar, DBLP, ORCID, ePrint, GitHub, LinkedIn, Website), cada `<a>` con `aria-label`. Mismo patrón de `{% if %}` que el `icon-links.html` actual, que **no se toca** |
| `_includes/intro.html` | párrafo `p.bio` (3-5 líneas) + chips desde `site.data.interests` (los 8 actuales, tal cual) |
| `_includes/featured.html` | tarjetas de destacados (lógica abajo) |
| `_includes/details-open.html` / `details-close.html` | par de includes que abren/cierran un `<details>` recibiendo `id`, `heading`, `count`, `open` (Liquid no permite includes con bloque, de ahí el par) |
| `_includes/cv-full.html` | botón «Expand all / Collapse all» + un `<details>` por sección |

**Lógica de destacados** (el punto crítico de la arquitectura de datos):

```liquid
{% assign none = "" | split: "," %}
{% assign projects = site.data.projects | default: none %}
{% assign pubs_i = site.data.publications | default: none | where: "featured", true %}
{% assign pubs_n = site.data.publications_national | default: none | where: "featured", true %}
{% assign proj_f = projects | where: "featured", true %}
{% assign featured = pubs_i | concat: pubs_n | concat: proj_f | sort: "featured_order" %}
{% assign featured = featured | slice: 0, 6 %}
```

- `default: none` evita que `concat` explote con `projects.yml` vacío.
- El `slice: 0, 6` es el **límite duro de 6** pedido en la especificación.
- Tipo de tarjeta: `Paper` si la entrada tiene `venue`, `Project` en caso contrario
  (los proyectos usan `name`, no `title`); un campo opcional `card_type` lo sobrescribe.
- El título de la tarjeta enlaza a `#{{ id }}`, que es la entrada completa de la
  sección 3.

**Secciones de `#cv-full`**, en este orden (son exactamente las que ya existen; no se
añade ni se quita ninguna):

1. `#publications` — *International Publications (8)* — **`open`**
2. `#publications-national` — *National Publications (3)*
3. `#experience` — *Experience (3)*
4. `#education` — *Education (3)*
5. `#projects` — *Projects (n)* — solo si `projects.yml` tiene entradas
6. `#talks` — *Selected Talks (2)*
7. `#service` — *Service & Teaching (5)*
8. `#awards` — *Honors & Awards (3)*
9. `#skills` — *Skills* (sin contador: contar grupos no dice nada útil)

El cuerpo de cada sección **reutiliza el markup actual** de
`_layouts/default.html:48-152` (`.entry`, `.entry-head`, `.award-list`,
`.service-list`, `.tags`, `.skill-group`), así que el CSS existente sigue sirviendo.

**`_includes/pub-list.html`** — cambio aditivo: añadir
`id="{{ pub.id | default: pub.title | slugify }}"` al `<li class="pub">`. El fallback
por slug del título garantiza que una entrada sin `id` tampoco rompe nada. El resto
del include (incluido el `replace` que pone en negrita `profile.me`) se mantiene.
Mismo patrón de `id` en las entradas de experiencia, educación, charlas y proyectos.

Al final de este paso `/preview/` ya muestra la estructura completa, fea pero con
todos los datos. `/` sigue intacta.

---

## Paso 3 — Estilos

Crear **`assets/css/cv.css`**, que el nuevo layout carga **después** de
`style.css`. Es un añadido, no un reemplazo: `style.css` aporta ya los tokens
`:root`, la tipografía del sistema, `.entry`, `.pub-*`, `.tags`, `.award-list` y la
hoja de impresión, y todo eso se reutiliza.

`cv.css` contiene:

- **Tokens nuevos** en `:root` (ancho de la rejilla, radios, sombras, `--card-hover`)
  y un `--maxw` mayor (≈1080px) para la zona de dos columnas, manteniendo la columna
  de texto legible.
- **Modo oscuro con botón**: duplicar los tokens oscuros en
  `:root[data-theme="dark"]` y los claros en `:root[data-theme="light"]`, de modo que
  el atributo gane al `@media (prefers-color-scheme: dark)` de `style.css` en ambas
  direcciones. Sin JS no hay atributo y queda el comportamiento automático de hoy.
- **Encabezado compacto**: foto + texto en fila en escritorio, apilado y más pequeño
  por debajo de 600px. Objetivo: que no se coma media pantalla.
- **Rejilla de dos columnas**: `grid-template-columns: minmax(0,1fr) minmax(0,1.1fr)`
  con `gap`; por debajo de 768px pasa a una columna con `intro` primero y
  `featured` después (orden natural del DOM, sin `order`).
- **Tarjetas de destacados**: borde, radio, `transition` de `box-shadow`/`transform`,
  elevación ligera en `:hover`; etiqueta de tipo como pill pequeña.
- **Chips** de intereses: reutilizan `.tags` con un toque de borde y color de acento.
- **`<details>`**: `summary` con `list-style: none` (+ `::-webkit-details-marker`),
  chevron SVG que rota 90° al abrir, cabecera con fondo suave, `cursor: pointer`,
  contador en color `--muted`, y `:focus-visible` bien visible.
- **`@media (prefers-reduced-motion: reduce)`**: todas las transiciones y
  animaciones a `none`.
- **`@media print`** (ampliando la de `style.css`): ocultar botón de tema,
  «Expand all» y botón de PDF; `details > div { display: block !important }` como red
  de seguridad; fondo blanco; evitar cortes dentro de tarjetas y entradas.

Comprobar 375px / 768px / ≥1200px y que no hay scroll horizontal en ningún ancho.

---

## Paso 4 — JavaScript (una sola mejora progresiva)

Crear **`assets/js/cv.js`**, cargado con `defer` únicamente desde `cv.html`. Vanilla,
sin dependencias, y la página debe quedar completamente usable si no se ejecuta.

1. **Anclas / enlaces profundos**: en `DOMContentLoaded` y en `hashchange`, buscar el
   elemento del hash, abrir con `.open = true` todos los `<details>` ancestros, hacer
   `scrollIntoView({ behavior: 'smooth', block: 'center' })` —o `'auto'` si
   `prefers-reduced-motion`— y añadir una clase `.is-target` que se quita a los ~2s.
   Esto hace funcionar `/#publications`, `/#cavefish-light-client-2026` y los enlaces
   de las tarjetas de destacados.
2. **Expand all / Collapse all**: alterna el `.open` de todos los `<details>` de
   `#cv-full` y cambia su propio texto y `aria-expanded` según el estado.
3. **Impresión**: en `beforeprint` guardar el estado de cada `<details>` y abrirlos
   todos; en `afterprint` restaurarlo. (El CSS de impresión ya cubre el caso de
   navegadores que no disparan estos eventos.)
4. **Botón de tema**: ciclo claro → oscuro → automático; escribe `data-theme` en
   `<html>` y persiste en `localStorage` con `try/catch` en lectura y escritura.
   El botón se marca `hidden` en el HTML y el script lo revela, para que no aparezca
   un botón muerto sin JS.

---

## Paso 5 — SEO, metadatos y accesibilidad

- `_config.yml`: rellenar `description` (está vacío y hoy no se emite ninguna meta
  description), y añadir `image: assets/dani_profile.jpg` + bloque `social` para que
  `jekyll-seo-tag` genere Open Graph y Twitter cards completas. No se añaden plugins:
  `jekyll-seo-tag` y `jekyll-sitemap` ya están y el despliegue es por GitHub Actions,
  así que la lista blanca de plugins de Pages no nos limita.
- `_includes/head.html`: cambio aditivo (`<link rel="canonical">` lo pone ya seo-tag;
  añadir solo el `<script defer src=".../cv.js">` desde el layout, no desde aquí, para
  no afectar al layout antiguo).
- Revisar la jerarquía `h1` (nombre) → `h2` (cabeceras de sección, dentro de
  `summary`) → `h3` (subapartados), `alt` en la foto, `aria-label` en cada
  icono-enlace, `:focus-visible` visible en toda la página y contraste suficiente en
  claro y oscuro.
- Conservar el `.skip-link` que ya existe.

---

## Paso 6 — Comprobación en local

```powershell
docker compose up      # requiere Docker Desktop arrancado
```

- `http://localhost:4000/preview/` → diseño nuevo
- `http://localhost:4000/` → web antigua, para comparar lado a lado que no falta nada

Recorrer la checklist del apartado 10 de la especificación (ver abajo) antes de
continuar.

---

## Paso 7 — Cambiar la home y limpiar

1. `index.md`: `layout: default` → `layout: cv`.
2. Borrar `preview.md` (ya no hace falta).
3. **Dejar** `_layouts/default.html`, `_includes/icon-links.html` y
   `assets/css/style.css` en el repo: el primero deja de usarse pero sirve de
   referencia y de vuelta atrás, y los otros dos siguen en uso (`style.css` lo carga
   el layout nuevo). Si más adelante quieres eliminar `default.html`, es un commit de
   un solo fichero.
4. Commit y push a `main` → GitHub Actions despliega.

---

## Ficheros implicados

**Nuevos**: `.claude/REDESIGN-PLAN.md`, `_data/projects.yml`, `_layouts/cv.html`,
`preview.md` (temporal), `_includes/hero.html`, `_includes/icon-links-svg.html`,
`_includes/intro.html`, `_includes/featured.html`, `_includes/cv-full.html`,
`_includes/details-open.html`, `_includes/details-close.html`,
`assets/css/cv.css`, `assets/js/cv.js`.

**Modificados (solo añadir)**: `_data/publications.yml`,
`_data/publications_national.yml`, `_data/profile.yml` (comentarios),
`_includes/pub-list.html` (atributo `id`), `_config.yml` (description, image, social),
`index.md` (una línea, en el Paso 7).

**No se toca**: `_layouts/default.html`, `_includes/icon-links.html`,
`_includes/head.html` (salvo nada), `assets/css/style.css`, `docker-compose.yml`,
`Gemfile`, `.github/workflows/pages.yml`, y ninguna entrada de datos existente.

---

## Verificación (criterios de aceptación)

- [ ] Comparar `/` (antigua) y `/preview/` (nueva): todas las entradas de los 9 YAML
      aparecen en la nueva, con sus enlaces.
- [ ] `grep` en `_layouts/` e `_includes/`: ningún dato del CV escrito a mano.
- [ ] Quitar `featured: true` de una publicación y recargar: desaparece de la
      sección 2 sin tocar nada más. Marcar 7 como destacadas: siguen saliendo 6.
- [ ] `International Publications` abierta al cargar; las demás cerradas.
- [ ] «Expand all / Collapse all» abre y cierra todo, y el texto del botón cambia.
- [ ] `/#publications` y `/#cavefish-light-client-2026` abren la sección, hacen scroll
      y resaltan brevemente la entrada; pinchar el título de una tarjeta destacada
      lleva a su ficha completa.
- [ ] Con JavaScript desactivado (DevTools → Settings → Debugger → Disable JS): la
      página se lee entera, los `<details>` abren y cierran, el botón de tema no
      aparece y la sección de publicaciones sigue abierta.
- [ ] 375px: una columna, sin scroll horizontal; 768px y 1200px correctos.
- [ ] Modo claro y oscuro (`prefers-color-scheme` del sistema) y los tres estados del
      botón; contraste legible en ambos.
- [ ] Vista previa de impresión (Ctrl+P): todas las secciones visibles, sin botones,
      fondo blanco.
- [ ] Navegación solo con teclado: Tab llega a todos los enlaces, `summary` se abre
      con Enter/Espacio, foco siempre visible.
- [ ] `docker compose up` construye sin errores ni warnings de Liquid; tras el push,
      el workflow de Actions termina en verde.

## Fuera de alcance

Versión bilingüe, blog/posts, buscador de publicaciones, y rellenar
`_data/projects.yml` con contenido real (la plantilla queda lista para cuando quieras).
