// Conteúdo extraído do material "LC – Design – Formação de Professores" (Aubrick / ISP)

export const OBJETIVOS_SEMESTRE = [
  {
    n: "01",
    texto:
      "Garantir que as Life Competencies sejam comunicadas de forma clara, acessível e significativa para estudantes de todas as idades, tornando-as visíveis nos espaços da escola, integradas às atividades pedagógicas e explicitamente referenciadas por professores e alunos no cotidiano escolar.",
  },
  {
    n: "02",
    texto:
      "Garantir que a abordagem da escola para Life Competencies seja claramente documentada e comunicada a toda a comunidade escolar (estudantes, professores e famílias), incluindo metodologias, programas e ferramentas utilizadas, com evidências concretas em portfólios (EI e Y1).",
  },
  {
    n: "03",
    texto:
      "Garantir que a escola tenha um conjunto acordado de Life Competencies, visíveis e integradas às aulas e aos ambientes de aprendizagem, com uso intencional por professores no planejamento e nas interações diárias.",
  },
];

export const BIG5_STATEMENTS: Record<string, string> = {
  cognitiva:
    "Conduzo minha própria aprendizagem por meio de resolução criativa de problemas, comunicação confiante e organização do meu tempo e dos meus recursos.",
  global:
    "Sou curioso(a) e respeitoso(a) com diferentes países e culturas, e me envolvo com questões locais e globais para agir pelo bem-estar das pessoas e do planeta.",
  digital:
    "Uso ferramentas e tecnologias digitais com segurança e responsabilidade para criar, colaborar e inovar.",
  autolideranca:
    "Gerencio minhas emoções e identifico minhas áreas de crescimento, usando motivação e resiliência para estabelecer metas e atingi-las.",
  interpessoal:
    "Construo relacionamentos positivos e trabalho efetivamente em equipe para alcançar objetivos comuns.",
};

export const FRAMEWORK_SKILLS: Record<string, Record<string, string[]>> = {
  interpessoal: {
    "Socioemocional": [
      "Identificar e compreender emoções (próprias e dos outros)",
      "Gerenciar e regular emoções",
      "Apoiar os outros",
      "Empatia e compaixão",
      "Confiança e respeito",
      "Autoconsciência e autogestão",
      "Consciência social",
    ],
    "Comunicação": [
      "Fazer perguntas",
      "Contar histórias",
      "Escuta ativa",
      "Adaptar linguagem ao contexto e audiência",
      "Facilitar interações",
      "Apresentação / oratória",
      "Influenciar",
    ],
    "Colaboração": [
      "Trabalho em equipe",
      "Coaching e empoderamento",
      "Negociação",
      "Valorizar ideias",
      "Assumir diferentes papéis",
      "Resolução de conflitos",
      "Trabalhar em direção a metas acordadas",
    ],
  },
  cognitiva: {
    "Pensamento Crítico": [
      "Resolução de problemas",
      "Raciocínio lógico e avaliação",
      "Tirar conclusões e interpretar dados",
      "Compreender vieses",
      "Reconhecer padrões e relações",
      "Pensamento analítico",
    ],
    "Criatividade": [
      "Flexibilidade",
      "Mentalidade de crescimento",
      "Mente aberta",
      "Imaginação",
      "Gerar e combinar ideias",
      "Imaginar alternativas e possibilidades",
      "Fazer e desenhar",
    ],
    "Curiosidade": [
      "Agilidade",
      "Investigador / fazer perguntas",
      "Reconhecer perspectivas",
      "Exploração e investigação",
      "Conforto com incerteza/ambiguidade",
      "Automotivação",
      "Fazer observações",
    ],
  },
  global: {
    "Cidadania": [
      "Justiça",
      "Integridade",
      "Respeito e compaixão",
      "Negociação",
      "Tomada de perspectiva",
      "Princípios éticos",
      "Pensamento ético, ambiental e de desenvolvimento sustentável",
    ],
    "Ação": [
      "Ação individual e coletiva",
      "Agência",
      "Letramento ambiental e cívico",
      "Consciência global",
      "Assumir responsabilidade",
      "Impactar e influenciar mudanças positivas",
      "Serviço",
    ],
    "Compreensão Intercultural": [
      "Mentalidade internacional",
      "Multilinguismo",
      "Diversidade, equidade e inclusão",
      "Compreender questões globais",
      "Apreciar visões de mundo dos outros",
      "Curiosidade pelo mundo",
      "Compreender a própria cultura e a dos outros",
    ],
  },
  digital: {
    "Letramento Digital": [
      "Habilidades técnicas funcionais",
      "Selecionar e usar ferramentas digitais adequadas",
      "Integrar tecnologia",
      "Compreender dispositivos e aplicativos",
      "Codificação / programação",
      "Criação de conteúdo",
      "Colaboração digital",
    ],
    "Responsabilidade Digital": [
      "Uso ético da tecnologia",
      "Julgamentos críticos sobre tecnologia",
      "Interação adequada no espaço digital",
      "Segurança online / bem-estar digital",
      "Cidadania digital",
      "Proteção digital",
    ],
    "Inovação": [
      "Acompanhar mudanças",
      "Empreendedorismo",
      "Apropriação e decisão",
      "Ação e iniciativa",
      "Aprender com tecnologias emergentes",
      "Decisões informadas",
      "Adaptar-se e adotar novas tecnologias",
    ],
  },
  autolideranca: {
    "Bem-estar": [
      "Autorregulação / autocuidado",
      "Paz interior / mindfulness",
      "Resiliência",
      "Vida fisicamente ativa",
      "Gerenciamento de estresse",
      "Alimentação e sono saudáveis",
      "Saúde e higiene pessoal",
    ],
    "Aprender a Aprender": [
      "Conhecer pontos fortes e áreas de crescimento",
      "Liderar a própria aprendizagem",
      "Compreender fatores que afetam o aprendizado",
      "Metacognição",
      "Avaliar o progresso",
      "Dar e receber feedback",
      "Decisão baseada em evidências",
    ],
    "Confiança": [
      "Resiliência",
      "Independência",
      "Autodireção",
      "Coragem",
      "Expressar pensamentos e opiniões",
      "Identificar e resolver problemas",
      "Autoadvocacia",
    ],
  },
};

export const ESTRATEGIAS_PEDAGOGICAS = [
  {
    titulo: "Nomear – Ensinar – Integrar",
    descricao:
      "Nomeie a habilidade → modele a habilidade → integre aos critérios de sucesso. Instrução explícita, prática integrada e modelagem do professor geram avanços nos resultados sociais, emocionais e acadêmicos.",
  },
  {
    titulo: "Estruturar a colaboração",
    descricao:
      "Atribua papéis claros: facilitador, verificador de evidências, registrador/sintetizador, controlador do tempo. Papéis bem definidos qualificam a participação e melhoram resultados acadêmicos e interpessoais.",
  },
  {
    titulo: "Integrar a reflexão ao ciclo de aprendizagem",
    descricao:
      "Inclua Learning to Learn / metacognição no fluxo da aula. Orientação sólida em reflexão produz melhores resultados e estudantes mais independentes.",
  },
];

export const LEARNING_FIRST_DESIGN = [
  { passo: "1", titulo: "Define Your Learning Outcomes", descricao: "Defina objetivos claros de Conhecimento, Habilidade e Compreensão (KSU) — para a disciplina e para o ISP Big 5." },
  { passo: "2", titulo: "Design Learning Experience", descricao: "Planeje a aula, tópico, unidade ou webinar conectando KSU à prática." },
  { passo: "3", titulo: "Gather Evidence", descricao: "Colete evidências em tempo real e ao longo do tempo, da aprendizagem dos estudantes." },
  { passo: "4", titulo: "Monitor & Adapt", descricao: "Monitore impacto, adapte e melhore o design com base em evidências." },
];

export const PLANO_EXEMPLO = {
  titulo: "Introdução à Colonização Portuguesa no Brasil",
  descricao:
    "Os alunos exploram o impacto da colonização portuguesa na sociedade, economia e cultura do Brasil durante o período colonial.",
  objetivos: [
    "Reconhecer o que é colonização, identificando colonizadores e colonizados.",
    "Conhecer 1–2 fatos sobre como a colonização mudou a sociedade brasileira.",
    "Conhecer 1–2 fatos sobre como a colonização impactou a economia.",
    "Conhecer 1–2 fatos sobre como a colonização influenciou a cultura.",
  ],
  momentos: [
    { titulo: "Aquecimento (5 min)", texto: "Discussão breve ativando conhecimentos prévios sobre o Brasil e colonização, com perguntas abertas, imagens ou vídeo curto." },
    { titulo: "Transmissão de Conhecimento (10 min)", texto: "Narrativa com mapas e imagens, explicando termos-chave em ambos os idiomas e ajustando o ritmo conforme a compreensão." },
    { titulo: "Exploração — Gallery Walk (15 min)", texto: "Estações com imagens, textos curtos e perguntas guiadas sobre impactos na sociedade, economia e cultura." },
    { titulo: "Skill Building (10 min)", texto: "Em duplas, escrever 1–2 frases usando: 'Por causa da colonização portuguesa… portanto…'." },
    { titulo: "Plenária (5 min)", texto: "Compartilhamento, consolidação e abertura para questões críticas em aulas futuras." },
  ],
  lcs: [
    { comp: "Interpessoal · Colaboração", desc: "Trabalho em grupos heterogêneos durante a gallery walk." },
    { comp: "Interpessoal · Comunicação", desc: "Expressão de ideias e explicações em português e inglês em pares e grupos." },
  ],
};

export const HOME_WELCOME = {
  titulo: "Bem-vindo à plataforma Competências para a Vida",
  texto:
    "Este ambiente apoia o desenvolvimento profissional dos professores, oferecendo formação continuada, recursos pedagógicos e ferramentas de avaliação para acompanhar o crescimento integral dos estudantes.",
};

export const ESTRUTURA_TRILHA = [
  "Introdução à competência",
  "Fundamentos pedagógicos",
  "Aplicações práticas por segmento",
  "Estratégias didáticas",
  "Estudos de caso",
  "Recursos complementares",
  "Quiz de autoavaliação",
  "Certificado interno",
];

export const TIPOS_RECURSO = [
  "Artigos",
  "Vídeos",
  "Podcasts",
  "Infográficos",
  "Guias práticos",
  "Ferramentas digitais",
  "Referências externas",
];

export const FILTROS_BIBLIOTECA = [
  "Competência",
  "Habilidade",
  "Segmento",
  "Disciplina",
  "Tipo de recurso",
];

export const MODELO_PLANO = [
  "Título",
  "Objetivo",
  "Competências trabalhadas",
  "Habilidades desenvolvidas",
  "Série/Turma",
  "Disciplina",
  "Descrição da atividade",
  "Materiais necessários",
  "Evidências de aprendizagem",
  "Critérios de avaliação",
  "Reflexão do professor",
];

export const INDICADORES_OBSERVAVEIS = [
  "Demonstra a habilidade em situações orientadas.",
  "Aplica a habilidade com autonomia crescente.",
  "Transfere a habilidade para novos contextos.",
];

export const ESCALA_DESENVOLVIMENTO = [
  { n: 1, label: "Inicial", desc: "Começa a demonstrar a habilidade com apoio." },
  { n: 2, label: "Em Desenvolvimento", desc: "Demonstra a habilidade com apoio reduzido." },
  { n: 3, label: "Proficiente", desc: "Demonstra a habilidade com autonomia." },
  { n: 4, label: "Avançado", desc: "Transfere a habilidade para novos contextos." },
];

export const DESAFIOS_MENSAIS = [
  { mes: "Janeiro", titulo: "Integração de competências", desc: "Criar uma atividade que integre duas competências." },
  { mes: "Fevereiro", titulo: "Plano de aula inovador", desc: "Compartilhar um plano de aula inovador com a comunidade." },
  { mes: "Março", titulo: "Ferramenta digital", desc: "Utilizar uma ferramenta digital para ampliar a aprendizagem." },
  { mes: "Abril", titulo: "Evidências de progresso", desc: "Registrar evidências de progresso de um aluno." },
];

export const BADGES = [
  { nome: "Inovador Pedagógico", desc: "Propõe abordagens criativas e originais." },
  { nome: "Compartilhador de Práticas", desc: "Contribui com planos e materiais para a comunidade." },
  { nome: "Mentor Colaborativo", desc: "Apoia colegas no desenvolvimento profissional." },
  { nome: "Explorador Digital", desc: "Integra ferramentas digitais ao planejamento." },
  { nome: "Avaliador Reflexivo", desc: "Registra evidências e avaliações de forma consistente." },
];
