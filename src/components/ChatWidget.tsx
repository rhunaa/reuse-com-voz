"use client";

import { useEffect, useRef, useState } from "react";

type Mensagem = { autor: "usuario" | "assistente"; texto: string };

const MENSAGEM_INICIAL: Mensagem = {
  autor: "assistente",
  texto:
    "Olá! Eu sou o assistente do ReUse. Posso pausar ou reativar um produto seu, listar o que você publicou, ou explicar como usar a plataforma. Como posso ajudar?",
};

export function ChatWidget() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_INICIAL]);
  const [entrada, setEntrada] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fimDasMensagensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDasMensagensRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens, enviando]);

  async function enviar() {
    const texto = entrada.trim();
    if (!texto || enviando) return;

    setMensagens((atual) => [...atual, { autor: "usuario", texto }]);
    setEntrada("");
    setEnviando(true);

    try {
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, sessionId }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setMensagens((atual) => [
          ...atual,
          { autor: "assistente", texto: dados.erro ?? "Algo deu errado." },
        ]);
        return;
      }

      setSessionId(dados.sessionId);
      setMensagens((atual) => [...atual, { autor: "assistente", texto: dados.texto }]);
    } catch {
      setMensagens((atual) => [
        ...atual,
        { autor: "assistente", texto: "Não consegui me conectar agora. Tente de novo." },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 left-6 z-50 flex flex-col items-end">
      {aberto && (
        <div className="mb-3 flex h-[420px] w-full max-w-80 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-[#1F5D35] px-4 py-3 text-sm font-bold text-white">
            Assistente ReUse
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                  m.autor === "usuario"
                    ? "ml-auto bg-[#CFEED8] text-[#1F2D22]"
                    : "bg-[#F3FAF4] text-[#1F2D22]"
                }`}
              >
                {m.texto}
              </div>
            ))}
            {enviando && (
              <div className="max-w-[85%] rounded-2xl bg-[#F3FAF4] px-3 py-2 text-sm text-[#68736B]">
                Digitando...
              </div>
            )}
            <div ref={fimDasMensagensRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
            className="flex gap-2 border-t border-[#DDEFE2] p-2"
          >
            <input
              className="flex-1 rounded-full bg-[#F3FAF4] px-4 py-2 text-sm outline-none"
              placeholder="Digite sua mensagem..."
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
            />
            <button
              type="submit"
              disabled={enviando}
              className="rounded-full bg-[#1F5D35] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              Enviar
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setAberto((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F5D35] text-2xl text-white shadow-xl hover:bg-[#173F24]"
        aria-label="Abrir assistente virtual"
      >
        {aberto ? "×" : "💬"}
      </button>
    </div>
  );
}
