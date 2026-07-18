"""
providers.py - the uniform call layer for every council seat.

Each seat is reached through run_seat(), which returns a SeatResult and NEVER
raises to the engine - a failing seat returns status 'unavailable' with a reason
(honest degraded state). Three transports:
  - OpenAI-compatible REST (DeepSeek / Fireworks / Gemini): schema embedded in
    the prompt, JSON parsed from the reply.
  - codex exec: native --output-schema (a file) + --output-last-message (a file),
    so structured output is read from disk rather than scraped from stdout.
  - claude -p: prompt on STDIN, --output-format json envelope, schema embedded in
    the prompt; ANTHROPIC_API_KEY is stripped so it bills the subscription.

The prompt always goes via STDIN for the CLIs, so giant/multiline/quoted prompts
never hit the command line (no Windows arg-quoting hazard).
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from dataclasses import dataclass

import httpx

from . import config
from .validators import OK, UNAVAILABLE


@dataclass
class SeatResult:
    status: str            # validators.OK | validators.UNAVAILABLE
    data: dict | None      # parsed JSON when a schema was requested
    text: str              # raw reply text
    model: str
    error: str | None = None


# --------------------------------------------------------------------------- #
# JSON extraction / shared helpers                                            #
# --------------------------------------------------------------------------- #

_FENCE = re.compile(r"```(?:json)?|```")


def _extract_json(text: str) -> dict | None:
    """Pull a JSON object out of a model reply, tolerant of prose, markdown
    fences, and CLI preamble. Prefers the last well-formed top-level object."""
    if not text:
        return None
    cleaned = _FENCE.sub("", text).strip()
    try:
        obj = json.loads(cleaned)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass
    best = None
    depth = 0
    start = None
    for i, ch in enumerate(cleaned):
        if ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}" and depth > 0:
            depth -= 1
            if depth == 0 and start is not None:
                try:
                    obj = json.loads(cleaned[start:i + 1])
                    if isinstance(obj, dict):
                        best = obj
                except json.JSONDecodeError:
                    pass
    return best


def _schema_instruction(json_schema: dict) -> str:
    return ("\n\nReturn ONLY a single valid JSON object conforming to this JSON Schema. "
            "No prose, no markdown fences, no commentary:\n" + json.dumps(json_schema))


def _finish(content: str, model: str, json_schema: dict | None) -> SeatResult:
    if json_schema is None:
        return SeatResult(OK, None, content, model)
    data = _extract_json(content)
    if data is None:
        return SeatResult(UNAVAILABLE, None, content, model, "no parseable JSON in reply")
    return SeatResult(OK, data, content, model)


def _tempfile(content: str, suffix: str) -> str:
    fd, path = tempfile.mkstemp(prefix="council_", suffix=suffix)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(content)
    return path


def _run_cli(argv: list[str], prompt: str, timeout: int,
             env: dict | None = None) -> tuple[int, str, str]:
    """Run a CLI with the prompt on STDIN. On Windows, npm .cmd/.ps1 shims are
    launched through cmd.exe (only flag args - all controlled - hit the line). On
    timeout, kill the WHOLE process tree: cmd.exe orphans the claude.exe / node
    grandchild otherwise, leaking subscription sessions (which crashed a run)."""
    if os.name == "nt" and not argv[0].lower().endswith(".exe"):
        argv = [os.environ.get("COMSPEC", "cmd.exe"), "/c"] + argv
    proc = subprocess.Popen(argv, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, text=True, encoding="utf-8",
                            errors="replace", env=env)
    try:
        out, err = proc.communicate(input=prompt, timeout=timeout)
        return proc.returncode, out or "", err or ""
    except subprocess.TimeoutExpired:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            proc.kill()
        try:
            proc.communicate(timeout=10)
        except Exception:
            pass
        raise


# --------------------------------------------------------------------------- #
# OpenAI-compatible REST seats (DeepSeek / Fireworks / Gemini)                 #
# --------------------------------------------------------------------------- #

def _call_openai(pcfg: dict, model: str, prompt: str, json_schema: dict | None,
                 timeout: int) -> SeatResult:
    key = os.getenv(pcfg["key_env"])
    if not key:
        return SeatResult(UNAVAILABLE, None, "", model, f"missing {pcfg['key_env']}")
    if json_schema is not None:
        prompt = prompt + _schema_instruction(json_schema)
    body: dict = {"model": model, "messages": [{"role": "user", "content": prompt}]}
    if json_schema is not None:
        body["response_format"] = {"type": "json_object"}
    try:
        r = httpx.post(f"{pcfg['base_url']}/chat/completions",
                       headers={"Authorization": f"Bearer {key}"}, json=body, timeout=timeout)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
    except Exception as e:  # network / API / shape -> degrade honestly
        return SeatResult(UNAVAILABLE, None, "", model, f"{type(e).__name__}: {str(e)[:160]}")
    return _finish(content, model, json_schema)


# --------------------------------------------------------------------------- #
# codex exec (Codex Pro subscription)                                         #
# --------------------------------------------------------------------------- #

def _call_codex(model: str | None, prompt: str, json_schema: dict | None,
                timeout: int) -> SeatResult:
    exe = shutil.which("codex")
    if not exe:
        return SeatResult(UNAVAILABLE, None, "", model or "codex", "codex CLI not installed")
    # Embed the schema in the PROMPT and read codex's final message from -o. Its
    # native --output-schema crashes on complex schemas; and the MCP/Neon transport
    # errors + nonzero exit are noise once the answer is in the -o file.
    # NB: do NOT pass --ignore-user-config - config.toml carries the subscription
    # provider/auth routing, and skipping it fast-fails.
    if json_schema is not None:
        prompt = prompt + _schema_instruction(json_schema)
    out_file = _tempfile("", ".out.json")
    argv = [exe, "exec", "--skip-git-repo-check", "--sandbox", "read-only", "--ephemeral",
            "-o", out_file]
    if model:
        argv += ["-m", model]
    argv += ["-"]  # read the prompt from stdin
    try:
        code, out, err = _run_cli(argv, prompt, timeout)
        content = out
        if os.path.exists(out_file):
            try:
                file_content = open(out_file, encoding="utf-8").read()
                if file_content.strip():
                    content = file_content
            except OSError:
                pass
        result = _finish(content, model or "codex", json_schema)
        if result.status == OK:
            return result
        return SeatResult(UNAVAILABLE, None, content, model or "codex",
                          (err or f"codex exited {code} with no usable output")[:200])
    except subprocess.TimeoutExpired:
        return SeatResult(UNAVAILABLE, None, "", model or "codex", "timeout")
    finally:
        try:
            os.unlink(out_file)
        except OSError:
            pass


# --------------------------------------------------------------------------- #
# claude -p (Ultimate subscription)                                           #
# --------------------------------------------------------------------------- #

def _call_claude(model: str, prompt: str, json_schema: dict | None, allow_web: bool,
                 timeout: int) -> SeatResult:
    exe = shutil.which("claude")
    if not exe:
        return SeatResult(UNAVAILABLE, None, "", model,
                          "claude CLI not installed (npm i -g @anthropic-ai/claude-code)")
    if json_schema is not None:
        prompt = prompt + _schema_instruction(json_schema)
    argv = [exe, "-p", "--model", model, "--output-format", "json"]
    if allow_web:
        argv += ["--allowedTools", "WebSearch,WebFetch", "--max-turns", "14"]
    else:
        argv += ["--disallowedTools", "*"]
    env = {k: v for k, v in os.environ.items() if k != "ANTHROPIC_API_KEY"}  # force subscription
    try:
        code, out, err = _run_cli(argv, prompt, timeout, env=env)
    except subprocess.TimeoutExpired:
        return SeatResult(UNAVAILABLE, None, "", model, "timeout")
    # claude -p --output-format json prints a result envelope even on error (exit 1),
    # e.g. {"is_error":true,"result":"Not logged in · Please run /login"} - surface that
    # actionable message rather than a generic "exited nonzero".
    content = out
    try:
        env_obj = json.loads(out)
        if isinstance(env_obj, dict):
            if env_obj.get("is_error"):
                return SeatResult(UNAVAILABLE, None, out, model, str(env_obj.get("result"))[:200])
            content = env_obj.get("result", out)
    except json.JSONDecodeError:
        if code != 0:
            return SeatResult(UNAVAILABLE, None, out, model, (err or "claude exited nonzero")[:200])
    return _finish(content, model, json_schema)


# --------------------------------------------------------------------------- #
# Dispatcher                                                                  #
# --------------------------------------------------------------------------- #

def run_seat(provider: str, model: str | None, prompt: str, *,
             json_schema: dict | None = None, allow_web: bool = False,
             timeout: int = 180) -> SeatResult:
    pcfg = config.PROVIDERS.get(provider)
    if not pcfg:
        return SeatResult(UNAVAILABLE, None, "", model or provider, f"unknown provider '{provider}'")
    try:
        kind = pcfg["kind"]
        if allow_web and kind != "claude_cli":
            # only the claude seat actually performs web research; fail honestly rather
            # than silently returning a no-web guess dressed up as verification.
            return SeatResult(UNAVAILABLE, None, "", model or provider,
                              f"provider '{provider}' has no web access (allow_web needs a web-capable seat)")
        if kind == "openai":
            return _call_openai(pcfg, model, prompt, json_schema, timeout)
        if kind == "codex_cli":
            return _call_codex(model, prompt, json_schema, timeout)
        if kind == "claude_cli":
            return _call_claude(model, prompt, json_schema, allow_web, timeout)
        return SeatResult(UNAVAILABLE, None, "", model or provider, f"unhandled kind '{kind}'")
    except Exception as e:  # last-resort guard - one seat never aborts the run
        return SeatResult(UNAVAILABLE, None, "", model or provider,
                          f"{type(e).__name__}: {str(e)[:160]}")
