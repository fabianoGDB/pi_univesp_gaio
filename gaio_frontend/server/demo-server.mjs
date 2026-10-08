/**
 * Servidor de demonstração do GAIÒ.
 *
 * Objetivo: permitir VISUALIZAR o frontend funcionando de ponta a ponta quando o
 * backend real (http://localhost:8080, na máquina do usuário) não está acessível.
 *
 * Ele serve o build estático do frontend E implementa, na MESMA origem, exatamente
 * os endpoints documentados em GUIA_API.md. Nenhum endpoint foi inventado: a lista
 * abaixo é a lista do guia.
 *
 *   POST   /api/auth/registrar
 *   POST   /api/auth/login
 *   GET    /api/enderecos/autocomplete?input=
 *   GET    /api/enderecos/detalhes?placeId=
 *   POST   /api/estimativas/calcular
 *   POST   /api/estimativas
 *   POST   /api/anuncios
 *   GET    /api/anuncios?id=&bairro=&status=
 *   PATCH  /api/anuncios/{id}
 *
 * Para usar o backend real, basta rodar o frontend com VITE_API_URL apontando para ele.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 3000);

/* ------------------------------------------------------------------ */
/* Base de dados em memória                                            */
/* ------------------------------------------------------------------ */

const db = {
  usuarios: [
    { id: 1, nome: 'Ana Souza', email: 'demo@gaio.com', senha: 'senha123' }
  ],
  estimativas: [],
  anuncios: [],
  sequenciais: { usuario: 2, estimativa: 1, anuncio: 1 }
};

const PRECO_M2 = {
  'vila mariana': 13390,
  'consolacao': 12500,
  'consolação': 12500,
  'pinheiros': 15200,
  'jardins': 18000,
  'jardim paulista': 18000,
  'moema': 16000,
  'itaim bibi': 17500,
  'perdizes': 14000,
  'vila olimpia': 16800,
  'vila olímpia': 16800,
  'brooklin': 14500,
  'tatuape': 9500,
  'tatuapé': 9500,
  'santana': 9000,
  'butanta': 10500,
  'butantã': 10500,
  'lapa': 10200,
  'ipiranga': 9800,
  'saude': 11000,
  'saúde': 11000
};

const PRECO_M2_PADRAO = 11000;

const normalizar = (texto = '') =>
  String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const precoM2De = (bairroOuCep = '') => {
  const chave = normalizar(bairroOuCep);
  const encontrado = Object.keys(PRECO_M2).find((bairro) => chave.includes(normalizar(bairro)));
  return encontrado ? PRECO_M2[encontrado] : PRECO_M2_PADRAO;
};

const arredondarMilhar = (valor) => Math.round(valor / 1000) * 1000;

const calcularEstimativa = ({ bairroOuCep, areaM2, quartos, banheiros, vagasGaragem }) => {
  const precoM2 = precoM2De(bairroOuCep);
  const valorEstimado = arredondarMilhar(Number(areaM2) * precoM2);

  // Faixa de +-7% e confiança base de 70%, conforme o exemplo do GUIA_API.md.
  const faixaMinima = Math.round(valorEstimado * 0.93);
  const faixaMaxima = Math.round(valorEstimado * 1.07);
  const confianca = 0.7;

  const dicasFotos = [
    'Tire ao menos 3 fotos da cozinha, com a bancada livre e a luz natural acesa.',
    'Fotografe a sala de dois ângulos diferentes para mostrar a amplitude do ambiente.',
    'Abra as cortinas e acenda todas as luzes antes de fotografar os quartos.',
    `Destaque as ${vagasGaragem} vaga(s) de garagem: imóveis com vaga valorizam mais rápido.`,
    `Registre os ${banheiros} banheiro(s) com o espelho limpo e sem objetos pessoais.`,
    'Evite fotos na vertical: prefira o formato horizontal, que valoriza melhor os ambientes.'
  ];

  return {
    valorEstimado,
    faixaMinima,
    faixaMaxima,
    confianca,
    dicasFotos,
    _meta: { precoM2, quartos, banheiros, vagasGaragem }
  };
};

const gerarTitulo = (bairro, estimativa) =>
  `${estimativa.parametros.quartos} quartos, ${estimativa.parametros.areaM2}m² em ${bairro}`;

const gerarDescricao = (bairro, enderecoCompleto, estimativa) => {
  const p = estimativa.parametros;
  return [
    `Excelente oportunidade em ${bairro}!`,
    '',
    `Imóvel de ${p.areaM2}m² com ${p.quartos} quarto(s), ${p.banheiros} banheiro(s) e ${p.vagasGaragem} vaga(s) de garagem.`,
    `Localização privilegiada: ${enderecoCompleto}.`,
    '',
    `Valor estimado: R$ ${estimativa.valorEstimado.toLocaleString('pt-BR')}`,
    `Faixa provável de mercado: R$ ${estimativa.faixaMinima.toLocaleString('pt-BR')} a R$ ${estimativa.faixaMaxima.toLocaleString('pt-BR')}`,
    '',
    'Agende sua visita e venha conhecer!'
  ].join('\n');
};

// Anúncios de exemplo para o usuário de demonstração
const semearAnuncios = () => {
  const exemplos = [
    {
      parametros: { bairroOuCep: 'Vila Mariana, Sao Paulo', areaM2: 105, quartos: 3, banheiros: 2, vagasGaragem: 2 },
      bairro: 'Vila Mariana',
      enderecoCompleto: 'Rua Domingos de Morais, Vila Mariana, São Paulo, SP',
      status: 'COMPLETO',
      publicado: true
    },
    {
      parametros: { bairroOuCep: 'Consolacao, Sao Paulo', areaM2: 80, quartos: 2, banheiros: 1, vagasGaragem: 1 },
      bairro: 'Consolação',
      enderecoCompleto: 'Rua Augusta, Consolação, São Paulo, SP',
      status: 'RASCUNHO',
      publicado: false
    },
    {
      parametros: { bairroOuCep: 'Pinheiros, Sao Paulo', areaM2: 62, quartos: 2, banheiros: 1, vagasGaragem: 0 },
      bairro: 'Pinheiros',
      enderecoCompleto: 'Rua dos Pinheiros, Pinheiros, São Paulo, SP',
      status: 'COMPLETO',
      publicado: false
    }
  ];

  exemplos.forEach((exemplo) => {
    const calculo = calcularEstimativa(exemplo.parametros);
    const estimativa = {
      id: db.sequenciais.estimativa++,
      usuarioId: 1,
      parametros: exemplo.parametros,
      valorEstimado: calculo.valorEstimado,
      faixaMinima: calculo.faixaMinima,
      faixaMaxima: calculo.faixaMaxima,
      confianca: calculo.confianca
    };
    db.estimativas.push(estimativa);

    db.anuncios.push({
      id: db.sequenciais.anuncio++,
      usuarioId: 1,
      estimativaId: estimativa.id,
      titulo: gerarTitulo(exemplo.bairro, estimativa),
      descricao: gerarDescricao(exemplo.bairro, exemplo.enderecoCompleto, estimativa),
      bairro: exemplo.bairro,
      enderecoCompleto: exemplo.enderecoCompleto,
      status: exemplo.status,
      publicado: exemplo.publicado,
      valorEstimado: estimativa.valorEstimado,
      faixaMinima: estimativa.faixaMinima,
      faixaMaxima: estimativa.faixaMaxima,
      confianca: estimativa.confianca,
      dicasFotos: calculo.dicasFotos
    });
  });
};

semearAnuncios();

/* ------------------------------------------------------------------ */
/* Helpers HTTP                                                        */
/* ------------------------------------------------------------------ */

const lerCorpo = (req) =>
  new Promise((resolve) => {
    let bruto = '';
    req.on('data', (chunk) => {
      bruto += chunk;
    });
    req.on('end', () => {
      if (!bruto) return resolve({});
      try {
        resolve(JSON.parse(bruto));
      } catch {
        resolve({});
      }
    });
  });

const responder = (res, status, corpo) => {
  const payload = JSON.stringify(corpo ?? {});
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  });
  res.end(payload);
};

const usuarioAutenticado = (req) => {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    const { email } = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return db.usuarios.find((u) => u.email === email) ?? null;
  } catch {
    return null;
  }
};

const emitirToken = (usuario) =>
  Buffer.from(JSON.stringify({ email: usuario.email, emitidoEm: Date.now() })).toString('base64');

const respostaAuth = (usuario) => ({
  token: emitirToken(usuario),
  tipo: 'Bearer',
  expiraEmMs: 86400000,
  usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
});

/* ------------------------------------------------------------------ */
/* Rotas da API                                                        */
/* ------------------------------------------------------------------ */

const rotasApi = async (req, res, url) => {
  const rota = url.pathname;
  const metodo = req.method ?? 'GET';

  if (metodo === 'OPTIONS') return responder(res, 204, {});

  /* ---------- Autenticação ---------- */

  if (rota === '/api/auth/registrar' && metodo === 'POST') {
    const corpo = await lerCorpo(req);
    const { nome, email, senha } = corpo;
    if (!nome || !email || !senha) {
      return responder(res, 400, { message: 'Informe nome, e-mail e senha.' });
    }
    if (db.usuarios.some((u) => u.email === email)) {
      return responder(res, 400, { message: 'Este e-mail já está cadastrado.' });
    }
    const usuario = { id: db.sequenciais.usuario++, nome, email, senha };
    db.usuarios.push(usuario);
    return responder(res, 201, respostaAuth(usuario));
  }

  if (rota === '/api/auth/login' && metodo === 'POST') {
    const corpo = await lerCorpo(req);
    const usuario = db.usuarios.find((u) => u.email === corpo.email && u.senha === corpo.senha);
    if (!usuario) {
      return responder(res, 401, { message: 'E-mail ou senha inválidos.' });
    }
    return responder(res, 200, respostaAuth(usuario));
  }

  /* ---------- Endereços ---------- */

  if (rota === '/api/enderecos/autocomplete' && metodo === 'GET') {
    const input = normalizar(url.searchParams.get('input') ?? '');
    if (input.length < 3) return responder(res, 200, []);

    const catalogo = [
      { placeId: 'ChIJ_vila_mariana', descricao: 'Rua Domingos de Morais, Vila Mariana, São Paulo - SP' },
      { placeId: 'ChIJ_consolacao', descricao: 'Rua Augusta, Consolação, São Paulo - SP' },
      { placeId: 'ChIJ_pinheiros', descricao: 'Rua dos Pinheiros, Pinheiros, São Paulo - SP' },
      { placeId: 'ChIJ_paulista', descricao: 'Avenida Paulista, Bela Vista, São Paulo - SP' },
      { placeId: 'ChIJ_moema', descricao: 'Avenida Ibirapuera, Moema, São Paulo - SP' },
      { placeId: 'ChIJ_itaim', descricao: 'Rua João Cachoeira, Itaim Bibi, São Paulo - SP' },
      { placeId: 'ChIJ_perdizes', descricao: 'Rua Cardoso de Almeida, Perdizes, São Paulo - SP' },
      { placeId: 'ChIJ_tatuape', descricao: 'Rua Tuiuti, Tatuapé, São Paulo - SP' },
      { placeId: 'ChIJ_santana', descricao: 'Avenida Braz Leme, Santana, São Paulo - SP' },
      { placeId: 'ChIJ_jardins', descricao: 'Alameda Santos, Jardim Paulista, São Paulo - SP' }
    ];

    const sugestoes = catalogo.filter((item) => normalizar(item.descricao).includes(input));
    return responder(res, 200, sugestoes);
  }

  if (rota === '/api/enderecos/detalhes' && metodo === 'GET') {
    const placeId = url.searchParams.get('placeId') ?? '';
    const mapa = {
      ChIJ_vila_mariana: {
        endereco: 'Rua Domingos de Morais, 1200',
        bairro: 'Vila Mariana',
        cidade: 'São Paulo',
        latitude: -23.5893,
        longitude: -46.6347
      },
      ChIJ_consolacao: {
        endereco: 'Rua Augusta, 2000',
        bairro: 'Consolação',
        cidade: 'São Paulo',
        latitude: -23.5567,
        longitude: -46.6621
      },
      ChIJ_pinheiros: {
        endereco: 'Rua dos Pinheiros, 800',
        bairro: 'Pinheiros',
        cidade: 'São Paulo',
        latitude: -23.5665,
        longitude: -46.6825
      },
      ChIJ_paulista: {
        endereco: 'Avenida Paulista, 1578',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        latitude: -23.5614,
        longitude: -46.6559
      },
      ChIJ_moema: {
        endereco: 'Avenida Ibirapuera, 3000',
        bairro: 'Moema',
        cidade: 'São Paulo',
        latitude: -23.6015,
        longitude: -46.6653
      },
      ChIJ_itaim: {
        endereco: 'Rua João Cachoeira, 900',
        bairro: 'Itaim Bibi',
        cidade: 'São Paulo',
        latitude: -23.5858,
        longitude: -46.6773
      },
      ChIJ_perdizes: {
        endereco: 'Rua Cardoso de Almeida, 500',
        bairro: 'Perdizes',
        cidade: 'São Paulo',
        latitude: -23.5365,
        longitude: -46.6756
      },
      ChIJ_tatuape: {
        endereco: 'Rua Tuiuti, 1500',
        bairro: 'Tatuapé',
        cidade: 'São Paulo',
        latitude: -23.5405,
        longitude: -46.5766
      },
      ChIJ_santana: {
        endereco: 'Avenida Braz Leme, 1000',
        bairro: 'Santana',
        cidade: 'São Paulo',
        latitude: -23.5085,
        longitude: -46.6255
      },
      ChIJ_jardins: {
        endereco: 'Alameda Santos, 900',
        bairro: 'Jardim Paulista',
        cidade: 'São Paulo',
        latitude: -23.5674,
        longitude: -46.6543
      }
    };

    const detalhes = mapa[placeId];
    if (!detalhes) return responder(res, 404, { message: 'Endereço não encontrado.' });
    return responder(res, 200, detalhes);
  }

  /* ---------- Estimativas ---------- */

  if (rota === '/api/estimativas/calcular' && metodo === 'POST') {
    const corpo = await lerCorpo(req);
    const { bairroOuCep, areaM2, quartos, banheiros, vagasGaragem } = corpo;
    if (!bairroOuCep || !areaM2 || quartos == null || banheiros == null || vagasGaragem == null) {
      return responder(res, 400, {
        message: 'Informe bairro ou CEP, área, quartos, banheiros e vagas de garagem.'
      });
    }
    const calculo = calcularEstimativa({ bairroOuCep, areaM2, quartos, banheiros, vagasGaragem });
    const { _meta, ...resposta } = calculo;
    return responder(res, 200, resposta);
  }

  if (rota === '/api/estimativas' && metodo === 'POST') {
    const usuario = usuarioAutenticado(req);
    if (!usuario) return responder(res, 401, { message: 'Sessão expirada. Faça login novamente.' });

    const corpo = await lerCorpo(req);
    const estimativa = {
      id: db.sequenciais.estimativa++,
      usuarioId: usuario.id,
      parametros: corpo.parametros,
      valorEstimado: corpo.valorEstimado,
      faixaMinima: corpo.faixaMinima,
      faixaMaxima: corpo.faixaMaxima,
      confianca: corpo.confianca
    };
    db.estimativas.push(estimativa);
    return responder(res, 201, estimativa);
  }

  /* ---------- Anúncios ---------- */

  if (rota === '/api/anuncios' && metodo === 'POST') {
    const usuario = usuarioAutenticado(req);
    if (!usuario) return responder(res, 401, { message: 'Sessão expirada. Faça login novamente.' });

    const corpo = await lerCorpo(req);
    const estimativa = db.estimativas.find(
      (e) => e.id === Number(corpo.estimativaId) && e.usuarioId === usuario.id
    );
    if (!estimativa) return responder(res, 404, { message: 'Estimativa não encontrada.' });

    const calculo = calcularEstimativa(estimativa.parametros);
    const anuncio = {
      id: db.sequenciais.anuncio++,
      usuarioId: usuario.id,
      estimativaId: estimativa.id,
      titulo: gerarTitulo(corpo.bairro, estimativa),
      descricao: gerarDescricao(corpo.bairro, corpo.enderecoCompleto, estimativa),
      bairro: corpo.bairro,
      enderecoCompleto: corpo.enderecoCompleto,
      status: 'RASCUNHO',
      publicado: false,
      valorEstimado: estimativa.valorEstimado,
      faixaMinima: estimativa.faixaMinima,
      faixaMaxima: estimativa.faixaMaxima,
      confianca: estimativa.confianca,
      dicasFotos: calculo.dicasFotos
    };
    db.anuncios.push(anuncio);
    return responder(res, 201, anuncio);
  }

  if (rota === '/api/anuncios' && metodo === 'GET') {
    const usuario = usuarioAutenticado(req);
    if (!usuario) return responder(res, 401, { message: 'Sessão expirada. Faça login novamente.' });

    const id = url.searchParams.get('id');
    const bairro = url.searchParams.get('bairro');
    const status = url.searchParams.get('status');

    let lista = db.anuncios.filter((a) => a.usuarioId === usuario.id);
    if (id) lista = lista.filter((a) => a.id === Number(id));
    if (bairro) lista = lista.filter((a) => normalizar(a.bairro).includes(normalizar(bairro)));
    if (status) lista = lista.filter((a) => a.status === status);

    return responder(res, 200, lista);
  }

  const patchAnuncio = rota.match(/^\/api\/anuncios\/(\d+)$/);
  if (patchAnuncio && metodo === 'PATCH') {
    const usuario = usuarioAutenticado(req);
    if (!usuario) return responder(res, 401, { message: 'Sessão expirada. Faça login novamente.' });

    const id = Number(patchAnuncio[1]);
    const anuncio = db.anuncios.find((a) => a.id === id && a.usuarioId === usuario.id);
    if (!anuncio) return responder(res, 404, { message: 'Anúncio não encontrado.' });

    const corpo = await lerCorpo(req);
    const statusFinal = corpo.status ?? anuncio.status;
    const publicadoFinal = corpo.publicado ?? anuncio.publicado;

    if (publicadoFinal === true && statusFinal !== 'COMPLETO') {
      return responder(res, 400, {
        message: 'Só é possível publicar um anúncio com status COMPLETO. Complete o anúncio primeiro.'
      });
    }

    Object.assign(anuncio, corpo);
    return responder(res, 200, anuncio);
  }

  return responder(res, 404, { message: 'Endpoint não encontrado.' });
};

/* ------------------------------------------------------------------ */
/* Arquivos estáticos (build do frontend) + fallback SPA               */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const servirEstatico = (res, caminhoArquivo) => {
  fs.readFile(caminhoArquivo, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(caminhoArquivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(conteudo);
  });
};

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    try {
      await rotasApi(req, res, url);
    } catch (erro) {
      responder(res, 500, { message: 'Erro interno no servidor de demonstração.' });
    }
    return;
  }

  const relativo = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const caminho = path.join(DIST_DIR, relativo);

  if (caminho.startsWith(DIST_DIR) && fs.existsSync(caminho) && fs.statSync(caminho).isFile()) {
    return servirEstatico(res, caminho);
  }

  // Fallback SPA: rotas do React Router resolvem no cliente
  return servirEstatico(res, path.join(DIST_DIR, 'index.html'));
});

servidor.listen(PORT, '0.0.0.0', () => {
  console.log(`GAIÒ demo rodando em http://localhost:${PORT}`);
});
