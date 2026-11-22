import sys, types, importlib.util, os
APP="/home/claude/proj/app"
def mod(name, **attrs):
    m = types.ModuleType(name); m.__dict__.update(attrs); sys.modules[name] = m; return m

# --- stubs for packages not installed in this sandbox ---
class FakeOpenAI:
    def __init__(self, **kw): self.kw = kw
mod("openai", OpenAI=FakeOpenAI)
mod("bson", ObjectId=lambda x: x)
mod("app"); mod("app.database"); mod("app.models"); mod("app.services"); mod("app.services.pdf_pipeline")
mod("app.database.connection", get_database=lambda: None)
mod("app.models.summary", Summary=object)
nv = FakeOpenAI(tag="nvidia")
mod("app.services.ai_service", NVIDIA_MODEL="nvidia/test", client=nv)
mod("app.services.pdf_pipeline.summarizer", summarize_pdf=lambda *a, **k: None)

# real config.py needs pydantic_settings: stub it minimally (reads env like the real one)
class BaseSettings:
    def __init__(self):
        for k, v in list(type(self).__annotations__.items()):
            d = getattr(type(self), k, None)
            raw = os.environ.get(k.upper(), d)
            setattr(self, k, type(d)(raw) if d is not None and not isinstance(raw, type(d)) else raw)
        for name in dir(type(self)):
            f = getattr(type(self), name)
            if getattr(f, "_validator", False):
                self.summarizer_provider = f(self.summarizer_provider)
mod("pydantic_settings", BaseSettings=BaseSettings, SettingsConfigDict=lambda **k: k)
def field_validator(*a, **k):
    def deco(fn):
        inner = fn.__func__ if isinstance(fn, classmethod) else fn
        def w(v): return inner(None, v)
        w._validator = True
        return w
    return deco
import pydantic; pydantic.field_validator = field_validator
os.environ.update(MONGODB_URI="x", DATABASE_NAME="x", SECRET_KEY="x")

def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec)
    sys.modules[name] = m; spec.loader.exec_module(m); return m

def fresh(provider=None):
    for k in ("SUMMARIZER_PROVIDER",): os.environ.pop(k, None)
    if provider: os.environ["SUMMARIZER_PROVIDER"] = provider
    cfg = load(APP+"/app/config.py", "app.config")
    return cfg, load(APP+"/app/services/summarizer_service.py", "app.services.summarizer_service")

# 1. default -> NVIDIA
cfg, svc = fresh()
c, m, p = svc.get_summarizer_backend()
assert (p, m, c.kw.get("tag")) == ("NVIDIA", "nvidia/test", "nvidia"), (p, m)
print("default ->", p, m)

# 2. OLLAMA_QWEN -> local client
cfg, svc = fresh("ollama_qwen")      # lower-case also accepted
c, m, p = svc.get_summarizer_backend()
assert p == "OLLAMA_QWEN" and m == "studymate-qwen" and c.kw["base_url"] == "http://localhost:11434/v1", c.kw
print("ollama  ->", p, m, c.kw["base_url"], "timeout", c.kw["timeout"])

# 3. bad value fails loudly
try:
    fresh("GPT")
    raise SystemExit("FAIL: bad provider accepted")
except ValueError as e:
    print("bad value rejected:", e)

# 4. generate() uses the chosen model name and strips <think>
cfg, svc = fresh("OLLAMA_QWEN")
svc.get_summarizer_backend()
calls = []
class R:  # fake chat response
    def __init__(s, t): s.choices=[types.SimpleNamespace(message=types.SimpleNamespace(content=t))]
class Comp:
    def create(s, **kw):
        calls.append(kw); return R("<think>hmm</think>{\"ok\": 1}")
svc._ollama_client.chat = types.SimpleNamespace(completions=Comp())
errs=[]; gen = svc._make_generate(errs)
assert gen([{"role":"user","content":"x"}]) == '{"ok": 1}' and calls[0]["model"] == "studymate-qwen"
print("generate() sent model =", calls[0]["model"], "| <think> stripped")

# 5. Ollama down -> errors collected, friendly message
class Boom:
    def create(s, **kw): raise ConnectionError("refused")
svc._ollama_client.chat = types.SimpleNamespace(completions=Boom())
errs=[]; gen = svc._make_generate(errs); assert gen([]) == "" and errs
print("Ollama down -> section falls back, error recorded:", errs[0])
print("ALL OK")
