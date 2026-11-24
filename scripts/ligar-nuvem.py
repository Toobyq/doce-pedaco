#!/usr/bin/env python3
"""Liga a nuvem (Supabase) no site da Doce Pedaço.

Uso:  python3 scripts/ligar-nuvem.py https://xxxx.supabase.co <chave anon/publishable>

1. Confere se a chave é a PÚBLICA (recusa service_role/secret).
2. Testa a conexão chamando a função vitrine_publica do banco.
3. Grava em assets/config.js, sobe a versão do modo offline e publica (git push).
"""
import base64, json, pathlib, re, subprocess, sys, urllib.request, urllib.error

RAIZ = pathlib.Path(__file__).resolve().parent.parent

def erro(msg):
    print("✗", msg); sys.exit(1)

if len(sys.argv) != 3:
    erro("uso: python3 scripts/ligar-nuvem.py <URL do projeto> <chave pública>")
url, chave = sys.argv[1].strip().rstrip("/"), sys.argv[2].strip()
if not re.fullmatch(r"https://[a-z0-9-]+\.supabase\.co", url):
    erro("a URL deve ser algo como https://abcdefgh.supabase.co")
if chave.startswith("sb_secret_"):
    erro("essa é a chave SECRETA. Use a chave anon / publishable.")
if chave.startswith("eyJ"):
    try:
        carga = json.loads(base64.urlsafe_b64decode(chave.split(".")[1] + "=="))
        if carga.get("role") != "anon":
            erro(f"essa chave é '{carga.get('role')}'. Use a chave anon (pública).")
    except (IndexError, ValueError):
        erro("chave inválida")
elif not chave.startswith("sb_publishable_"):
    erro("não reconheci a chave. Ela começa com eyJ... ou sb_publishable_...")

# teste de conexão
cab = {"apikey": chave, "Content-Type": "application/json"}
if chave.startswith("eyJ"):
    cab["Authorization"] = f"Bearer {chave}"
req = urllib.request.Request(f"{url}/rest/v1/rpc/vitrine_publica", data=b"{}", headers=cab, method="POST")
try:
    with urllib.request.urlopen(req, timeout=20) as r:
        print("✓ banco respondeu:", (r.read().decode() or "null")[:80], "(null = vitrine ainda vazia, normal)")
except urllib.error.HTTPError as e:
    corpo = e.read().decode()[:200]
    if "vitrine_publica" in corpo or e.code == 404:
        erro("a função vitrine_publica não existe. Rode o docs/supabase.sql no SQL Editor primeiro.")
    erro(f"o banco respondeu {e.code}: {corpo}")
except urllib.error.URLError as e:
    erro(f"não consegui conectar: {e.reason}")

# grava no config.js
cfg = RAIZ / "assets/config.js"
texto = cfg.read_text()
novo, n = re.subn(r'nuvem:\s*\{[^}]*\}', f'nuvem: {{ url: "{url}", chave: "{chave}" }}', texto, count=1)
if n != 1:
    erro("não achei a linha 'nuvem:' no config.js")
cfg.write_text(novo)
sw = RAIZ / "sw.js"
s = sw.read_text(); m = re.search(r'"dp-v(\d+)"', s)
if m:
    sw.write_text(s.replace(m.group(0), f'"dp-v{int(m.group(1)) + 1}"'))
subprocess.run(["node", "--check", str(cfg)], check=True)
print("✓ config.js atualizado")

if "--sem-publicar" not in sys.argv:
    subprocess.run(["git", "-C", str(RAIZ), "add", "assets/config.js", "sw.js"], check=True)
    subprocess.run(["git", "-C", str(RAIZ), "commit", "-q", "-m",
                    "feat: liga a nuvem (Supabase) no site\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"], check=True)
    subprocess.run(["git", "-C", str(RAIZ), "push", "-q"], check=True)
    print("✓ publicado. Em 1–2 minutos o site já usa a nuvem.")
