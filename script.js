const state = {
  hopAsym: 0,
  forceAsym: 0,
  globalAsym: 0,
  weakLeg: '-',
  hopWeakLeg: '-',
  forceWeakLeg: '-',
  status: 'Sem avaliação'
};

const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileOverlay = document.getElementById('mobileOverlay');
let currentTrainingRows = [];
let currentTrainingMeta = {};

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    closeMobileMenu();
  });
});

function openMobileMenu() {
  sidebar.classList.add('open');
  mobileOverlay.classList.add('open');
}

function closeMobileMenu() {
  sidebar.classList.remove('open');
  mobileOverlay.classList.remove('open');
}

mobileMenuBtn.addEventListener('click', openMobileMenu);
closeMenuBtn.addEventListener('click', closeMobileMenu);
mobileOverlay.addEventListener('click', closeMobileMenu);

document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', calculateAll);
});

function nums(selector) {
  return [...document.querySelectorAll(selector)]
    .map(i => Number(i.value))
    .filter(n => !isNaN(n) && n > 0);
}

function asymmetry(a, b) {
  if (!a || !b) return 0;
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  return ((max - min) / max) * 100;
}

function classify(value) {
  if (!value) return { label: 'Sem avaliação', color: '' };
  if (value < 10) return { label: 'Aceitável', color: 'green' };
  if (value <= 15) return { label: 'Atenção', color: 'orange' };
  return { label: 'Alto risco', color: 'red' };
}

function fmt(n) {
  return `${n.toFixed(1).replace('.', ',')}%`;
}

function weakLegFromValues(right, left) {
  if (!right || !left || right === left) return '-';
  return right < left ? 'Direita' : 'Esquerda';
}

function calculateAll() {
  const hopR = Math.max(0, ...nums('.hop-r'));
  const hopL = Math.max(0, ...nums('.hop-l'));
  const forceR = Number(document.getElementById('forceR').value) || 0;
  const forceL = Number(document.getElementById('forceL').value) || 0;

  state.hopAsym = asymmetry(hopR, hopL);
  state.forceAsym = asymmetry(forceR, forceL);
  state.hopWeakLeg = weakLegFromValues(hopR, hopL);
  state.forceWeakLeg = weakLegFromValues(forceR, forceL);

  const valid = [state.hopAsym, state.forceAsym].filter(v => v > 0);
  state.globalAsym = valid.length ? valid.reduce((a,b) => a + b, 0) / valid.length : 0;

  state.weakLeg = resolveWeakLeg();
  const status = classify(state.globalAsym);
  state.status = status.label;

  renderHop(hopR, hopL);
  renderForce(forceR, forceL);
  renderDashboard(status);
  renderDiagnosis();
  renderTraining();
  renderReport();
}

function resolveWeakLeg() {
  const legs = [state.hopWeakLeg, state.forceWeakLeg].filter(l => l !== '-');
  if (!legs.length) return '-';
  const right = legs.filter(l => l === 'Direita').length;
  const left = legs.filter(l => l === 'Esquerda').length;
  if (right === left) return legs[0];
  return right > left ? 'Direita' : 'Esquerda';
}

function renderHop(r, l) {
  const box = document.getElementById('hopResult');
  if (!r || !l) {
    box.innerHTML = 'Preencha as marcas das duas pernas para calcular.';
    return;
  }
  const c = classify(state.hopAsym);
  box.innerHTML = `
    <strong>Melhor salto direito:</strong> ${r} cm<br>
    <strong>Melhor salto esquerdo:</strong> ${l} cm<br>
    <strong>Assimetria de potência:</strong> ${fmt(state.hopAsym)}
    <span class="badge ${c.color}">${c.label}</span><br>
    <strong>Perna mais fraca no salto:</strong> ${state.hopWeakLeg}
  `;
}

function renderForce(r, l) {
  const box = document.getElementById('forceResult');
  const exercise = document.getElementById('exercise').value;
  const type = document.getElementById('testType').value;
  if (!r || !l) {
    box.innerHTML = 'Preencha as cargas das duas pernas para calcular.';
    return;
  }
  const c = classify(state.forceAsym);
  box.innerHTML = `
    <strong>Exercício:</strong> ${exercise} - ${type}<br>
    <strong>Carga direita:</strong> ${r} kg<br>
    <strong>Carga esquerda:</strong> ${l} kg<br>
    <strong>Assimetria de força:</strong> ${fmt(state.forceAsym)}
    <span class="badge ${c.color}">${c.label}</span><br>
    <strong>Perna mais fraca na força:</strong> ${state.forceWeakLeg}
  `;
}

function renderDashboard(status) {
  document.getElementById('dashSalto').textContent = fmt(state.hopAsym);
  document.getElementById('dashForca').textContent = fmt(state.forceAsym);
  document.getElementById('dashGlobal').textContent = fmt(state.globalAsym);
  document.getElementById('dashWeakLeg').textContent = state.weakLeg;

  const pill = document.getElementById('globalStatus');
  pill.className = `status-pill ${status.color}`;
  pill.textContent = status.label;

  document.getElementById('quickSummary').innerHTML = state.globalAsym
    ? `O atleta apresenta <strong>${fmt(state.globalAsym)}</strong> de assimetria global. Status: <strong>${status.label}</strong>. Perna prioritária: <strong>${state.weakLeg}</strong>.`
    : 'Preencha os testes de salto e carga máxima para gerar o diagnóstico automático.';
}

function renderDiagnosis() {
  const d = document.getElementById('diagnosis');
  if (!state.globalAsym) {
    d.innerHTML = 'Preencha os testes para gerar o diagnóstico.';
    return;
  }

  let profile = '';
  if (state.forceAsym < 10 && state.hopAsym >= 15) {
    profile = 'Boa força máxima, porém déficit importante de potência, estabilidade ou controle neuromuscular. Priorizar pliometria, aterrissagem e controle de joelho/quadril.';
  } else if (state.forceAsym >= 15 && state.hopAsym < 10) {
    profile = 'Déficit estrutural de força. Priorizar musculação unilateral, quadríceps, posteriores e glúteos antes de aumentar a complexidade pliométrica.';
  } else if (state.forceAsym >= 15 && state.hopAsym >= 15) {
    profile = 'Assimetria crítica combinada. Alto risco no retorno ao combate. Recomenda-se reduzir exposição a saltos intensos, giro e combate até reavaliar.';
  } else if (state.globalAsym >= 10) {
    profile = 'Assimetria moderada. Há necessidade de correção progressiva com volume extra para a perna mais fraca.';
  } else {
    profile = 'Assimetria dentro de faixa aceitável. Manter treino unilateral preventivo e monitorar evolução.';
  }

  const c = classify(state.globalAsym);
  d.innerHTML = `
    <strong>Assimetria global:</strong> ${fmt(state.globalAsym)} <span class="badge ${c.color}">${c.label}</span><br>
    <strong>Perna prioritária:</strong> ${state.weakLeg}<br>
    <strong>Perfil neuromuscular:</strong> ${profile}<br><br>
    <strong>Observação de segurança:</strong> em pós-lesão, teste máximo e salto dinâmico devem ser liberados por fisioterapeuta ou médico do esporte.
  `;
}

function renderTraining() {
  const t = document.getElementById('trainingPlan');
  if (!state.globalAsym) {
    currentTrainingRows = [];
    currentTrainingMeta = {};
    t.innerHTML = 'Faça os testes para montar a planilha.';
    return;
  }

  const model = buildTrainingModel();
  currentTrainingRows = model.rows;
  currentTrainingMeta = model;

  t.innerHTML = `
    <strong>Volume recomendado:</strong> ${model.volume}<br>
    <strong>Foco:</strong> ${model.focus}<br>
    <strong>Perna prioritária:</strong> ${state.weakLeg}<br>
    <table>
      <thead><tr><th>Exercício</th><th>Séries x repetições</th><th>Observação</th></tr></thead>
      <tbody>${model.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody>
    </table>
  `;
}

function buildTrainingModel() {
  let volume = '1:1';
  let focus = 'Manutenção, prevenção e performance.';
  let rows = [];

  if (state.globalAsym < 10) {
    volume = '1:1';
    rows = [
      ['Agachamento Búlgaro', '3x8-10', 'Ambas as pernas'],
      ['Single Leg Deadlift', '3x10', 'Ambas as pernas'],
      ['Step-Up', '3x12', 'Ambas as pernas'],
      ['Saltos técnicos leves', '3x6', 'Controle e qualidade']
    ];
  } else if (state.globalAsym <= 15) {
    volume = '2:1 leve';
    focus = 'Começar pela perna fraca e adicionar 1 série extra nela.';
    rows = [
      ['Cadeira Extensora Unilateral', '4x10-12', `+1 série na ${state.weakLeg}`],
      ['Mesa Flexora Unilateral', '4x10-12', `+1 série na ${state.weakLeg}`],
      ['Step-Up com halteres', '4x8-10', 'Controle de joelho'],
      ['Hip Thrust Unilateral', '4x10', `Priorizar ${state.weakLeg}`],
      ['Single Leg Hop controlado', '3x5', 'Baixo volume']
    ];
  } else {
    volume = '2:1 a 3:1';
    focus = 'Foco corretivo avançado. Evitar combate competitivo até reduzir para abaixo de 10%, especialmente em pós-lesão.';
    rows = [
      ['Leg Press Unilateral', '5x8-10', `Ênfase excêntrica na ${state.weakLeg}`],
      ['Hip Thrust Unilateral', '5x10-12', `Priorizar ${state.weakLeg}`],
      ['Extensora Unilateral', '5x10-12', 'Controle total'],
      ['Flexora Unilateral', '5x10-12', 'Fortalecer frenagem do chute'],
      ['Aterrissagem Unilateral', '4x6-8', 'Sem valgo de joelho'],
      ['Y-Balance Drill', '4x30s', 'Propriocepção e estabilidade']
    ];
  }

  return { volume, focus, rows };
}

function renderReport() {
  const nome = document.getElementById('nome').value || 'Atleta não informado';
  const lesao = document.getElementById('lesao').value || 'Não informado';
  const exercise = document.getElementById('exercise').value;
  const r = document.getElementById('finalReport');

  if (!state.globalAsym) {
    r.innerHTML = 'O relatório será gerado automaticamente após os testes.';
    return;
  }

  r.innerHTML = `
    <h3>Relatório de Avaliação</h3>
    <strong>Atleta:</strong> ${nome}<br>
    <strong>Histórico de lesão:</strong> ${lesao}<br>
    <strong>Teste de força:</strong> ${exercise}<br>
    <strong>Assimetria no salto:</strong> ${fmt(state.hopAsym)}<br>
    <strong>Assimetria na força:</strong> ${fmt(state.forceAsym)}<br>
    <strong>Índice global:</strong> ${fmt(state.globalAsym)}<br>
    <strong>Perna prioritária:</strong> ${state.weakLeg}<br>
    <strong>Status:</strong> ${state.status}<br><br>
    <strong>Conduta:</strong> seguir a planilha recomendada e reavaliar em 2 a 4 semanas.
  `;
}

function resetForm() {
  document.querySelectorAll('input').forEach(i => i.value = '');
  calculateAll();
}

function athleteName() {
  return document.getElementById('nome').value || 'Atleta não informado';
}

function ensureTrainingReady() {
  if (!state.globalAsym || !currentTrainingRows.length) {
    alert('Preencha os testes de salto e carga máxima para gerar a planilha antes de baixar.');
    return false;
  }
  return true;
}

function printTrainingPDF() {
  if (!ensureTrainingReady()) return;
  const rows = currentTrainingRows.map(r => `
    <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>
  `).join('');
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Planilha de Treino - ${athleteName()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #0a192f; }
        h1 { margin-bottom: 4px; color: #0a192f; }
        .meta { margin: 14px 0 22px; line-height: 1.7; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th { background: #0a192f; color: white; text-align: left; }
        th, td { border: 1px solid #cfd8e3; padding: 10px; }
        .note { margin-top: 18px; padding: 12px; background: #eef6ff; border-left: 4px solid #1e90ff; }
      </style>
    </head>
    <body>
      <h1>Planilha de Treino Recomendada</h1>
      <div class="meta">
        <strong>Atleta:</strong> ${athleteName()}<br>
        <strong>Assimetria global:</strong> ${fmt(state.globalAsym)}<br>
        <strong>Assimetria salto:</strong> ${fmt(state.hopAsym)}<br>
        <strong>Assimetria força:</strong> ${fmt(state.forceAsym)}<br>
        <strong>Perna prioritária:</strong> ${state.weakLeg}<br>
        <strong>Volume recomendado:</strong> ${currentTrainingMeta.volume}<br>
        <strong>Foco:</strong> ${currentTrainingMeta.focus}
      </div>
      <table>
        <thead><tr><th>Exercício</th><th>Séries x repetições</th><th>Observação</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="note">Recomendação inicial. Ajuste intensidade, dor, fase de reabilitação e liberação profissional. Reavaliar em 2 a 4 semanas.</div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

function downloadTrainingImage() {
  if (!ensureTrainingReady()) return;
  const canvas = document.createElement('canvas');
  const width = 1200;
  const rowH = 72;
  const height = 430 + currentTrainingRows.length * rowH;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#06111f';
  ctx.fillRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#0a192f');
  gradient.addColorStop(1, '#112240');
  ctx.fillStyle = gradient;
  roundRect(ctx, 40, 40, width - 80, height - 80, 28, true);

  ctx.fillStyle = '#64ffda';
  ctx.font = 'bold 42px Arial';
  ctx.fillText('Planilha de Treino Recomendada', 80, 110);
  ctx.fillStyle = '#e6f1ff';
  ctx.font = '24px Arial';
  ctx.fillText(`Atleta: ${athleteName()}`, 80, 155);
  ctx.fillText(`Assimetria global: ${fmt(state.globalAsym)} | Perna prioritária: ${state.weakLeg}`, 80, 195);
  ctx.fillText(`Volume: ${currentTrainingMeta.volume}`, 80, 235);
  wrapCanvasText(ctx, `Foco: ${currentTrainingMeta.focus}`, 80, 275, width - 160, 28);

  let y = 360;
  ctx.fillStyle = '#1e90ff';
  roundRect(ctx, 70, y - 38, width - 140, 54, 14, true);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Exercício', 92, y - 3);
  ctx.fillText('Séries x repetições', 525, y - 3);
  ctx.fillText('Observação', 775, y - 3);

  y += 32;
  currentTrainingRows.forEach((r, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#132b4d' : '#0a192f';
    roundRect(ctx, 70, y, width - 140, rowH - 8, 12, true);
    ctx.fillStyle = '#e6f1ff';
    ctx.font = '21px Arial';
    wrapCanvasText(ctx, r[0], 92, y + 28, 390, 24);
    ctx.fillText(r[1], 525, y + 34);
    wrapCanvasText(ctx, r[2], 775, y + 28, 330, 24);
    y += rowH;
  });

  ctx.fillStyle = '#8da7c7';
  ctx.font = '18px Arial';
  ctx.fillText('TKD Symmetry Pro • Reavaliar em 2 a 4 semanas • Ajustar conforme dor e liberação profissional', 80, height - 70);

  const a = document.createElement('a');
  a.download = `planilha-treino-${athleteName().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

calculateAll();
