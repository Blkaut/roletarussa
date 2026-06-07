const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// ─── estado em memória ───────────────────────────────────────────────────────
// câmara compartilhada: avança a cada disparo, reseta ao chegar em 6 ou na morte
let balaAtual = 1;           // qual câmara está na mira agora (1–6)
let balaDaMorte = sortearBala(); // em qual câmara está a bala (1–6)

// mortes por usuário: { "nome_minusculo": número }
const mortes = {};

function sortearBala() {
  return Math.floor(Math.random() * 6) + 1;
}

function resetarRevolver() {
  balaAtual = 1;
  balaDaMorte = sortearBala();
}

// ─── rota principal ──────────────────────────────────────────────────────────
// GET /roleta?user=Lucas
app.get("/roleta", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  const user = (req.query.user || "Anônimo").trim();
  const camara = balaAtual;

  let resposta;

  if (camara === balaDaMorte) {
    // ── MORTE ──
    const chave = user.toLowerCase();
    mortes[chave] = (mortes[chave] || 0) + 1;
    const totalMortes = mortes[chave];
    const vezesStr = totalMortes === 1 ? "1 vez" : `${totalMortes} vezes`;

    resposta =
      `😵💥🔫 ${user} puxou o gatilho e morreu na ${camara} bala, que azar! 👀` +
      `${user} já morreu ${vezesStr} jogando roleta russa. 🤭` +
      `O revólver foi recarregado!`;

    resetarRevolver();
  } else {
    // ── SOBREVIVEU ──
    const proxima = balaAtual + 1;
    balaAtual++;

    if (balaAtual > 6) {
      // chegou ao fim sem ninguém morrer — reseta
      resposta =
        `😮‍💨❌🔫 ${user} puxou o gatilho e se safou! ` +
        `Ufa... todas as 6 câmaras foram disparadas sem mortes. ` +
        `O revólver foi recarregado!`;
      resetarRevolver();
    } else {
      resposta =
        `😮‍💨❌🔫 ${user} puxou o gatilho e se safou! ` +
        `A próxima câmara é a ${proxima}/6... quem vai tentar a sorte? 🤭`;
    }
  }

  res.send(resposta);
});

// ─── rota de status (opcional, útil pra debug) ───────────────────────────────
app.get("/status", (req, res) => {
  res.json({
    camaraAtual: balaAtual,
    balaDaMorte: balaDaMorte, // remova essa linha em produção se quiser manter suspense
    mortes,
  });
});

// ─── rota de reset manual (protegida por senha simples) ──────────────────────
app.get("/reset", (req, res) => {
  const senha = process.env.SENHA_RESET || "streamer123";
  if (req.query.senha !== senha) {
    return res.status(403).send("Senha incorreta.");
  }
  resetarRevolver();
  Object.keys(mortes).forEach((k) => delete mortes[k]);
  res.send("Revólver resetado e mortes zeradas com sucesso!");
});

app.listen(PORT, () => {
  console.log(`🔫 Roleta Russa API rodando na porta ${PORT}`);
});
