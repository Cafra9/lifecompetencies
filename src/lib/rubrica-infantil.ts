// Rubrica iSP Life Competencies — Estágio 1 · Educação Infantil (4-7 anos)
// Extraído do ISP Life Competencies Brochure (páginas 10-19)

export type Nivel = "iniciando" | "desenvolvendo" | "dominando";
export type NivelOuNA = Nivel | "nao_aplica";

export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciando: "Iniciando",
  desenvolvendo: "Desenvolvendo",
  dominando: "Dominando",
};

export const NIVEL_OU_NA_LABEL: Record<NivelOuNA, string> = {
  ...NIVEL_LABEL,
  nao_aplica: "Não se aplica",
};

export interface RubricaHabilidade {
  habilidade: string;
  descritores: Record<Nivel, string>;
  exemplos: Record<Nivel, string[]>;
}

export interface RubricaCompetencia {
  competencia: string;
  slug: "cognitiva" | "global" | "digital" | "autolideranca" | "interpessoal";
  habilidades: RubricaHabilidade[];
}

export const SEGMENTOS = [
  { id: "infantil", label: "Educação Infantil", idade: "4-7 anos", estagio: 1, disponivel: true },
  { id: "fund_iniciais", label: "Fundamental Anos Iniciais", idade: "7-11 anos", estagio: 2, disponivel: false },
  { id: "fund_finais", label: "Fundamental Anos Finais", idade: "11-14 anos", estagio: 3, disponivel: false },
  { id: "medio", label: "Ensino Médio", idade: "14-18 anos", estagio: 4, disponivel: false },
] as const;

export const RUBRICA_INFANTIL: RubricaCompetencia[] = [
  {
    competencia: "Cognitivo",
    slug: "cognitiva",
    habilidades: [
      {
        habilidade: "Pensamento Crítico",
        descritores: {
          iniciando:
            "Tentativas iniciais de questionamento ou de fazer distinções, contando com sugestões ou apoio de adultos.",
          desenvolvendo:
            "Independência crescente, aplicando raciocínio e fazendo distinções mais por conta própria, com alguma orientação.",
          dominando:
            "Demonstra de forma independente pensamento crítico, faz perguntas mais profundas e fornece explicações lógicas.",
        },
        exemplos: {
          iniciando: [
            'Faz perguntas simples sobre histórias, como "O que aconteceu?" ou "Quem é esse?".',
            "Diz quando algo é real ou fictício se alguém ajuda ou pede para pensar sobre isso.",
            "Adivinha o que pode acontecer a seguir, mas nem sempre explica por quê.",
          ],
          desenvolvendo: [
            'Às vezes faz perguntas do tipo "por que" e "como", mas pode precisar de ajuda para pensar nelas.',
            "Começa a explicar se algo é real ou fictício, mas precisa de ajuda para descobrir o porquê.",
            "Adivinha o que vai acontecer e às vezes dá uma razão, com ajuda para explicar o raciocínio.",
          ],
          dominando: [
            'Faz perguntas "por que" e "como" sobre histórias e aulas de forma autônoma.',
            "Fala sobre as diferenças entre o real e o imaginário em livros e filmes.",
            "Explica o que acha que vai acontecer em uma história/experimento e dá razões.",
          ],
        },
      },
      {
        habilidade: "Criatividade",
        descritores: {
          iniciando:
            "Começa a imaginar, criar e seguir instruções, mas precisa de orientação significativa para expressar ideias.",
          desenvolvendo:
            "Toma mais iniciativa em imaginar e gerar ideias, com apoio ocasional para dar vida a elas.",
          dominando:
            "Independência criativa: imagina, articula e executa ideias em diferentes situações com confiança e originalidade.",
        },
        exemplos: {
          iniciando: [
            "Imagina situações quando alguém ajuda ou dá exemplos, mas nem sempre fala sobre elas.",
            "Segue instruções para criar algo, mas precisa de ajuda para ter ideias próprias.",
            "Faz as coisas do jeito que mostram; não costuma pensar em mudá-las.",
          ],
          desenvolvendo: [
            "Imagina situações e às vezes as descreve, mas pode precisar de sugestões para dar vida a elas.",
            "Tem algumas ideias próprias quando recebe instruções claras.",
            "Às vezes pensa em melhorar algo, mas pode precisar de ajuda para explicar ou testar.",
          ],
          dominando: [
            "Imagina situações diferentes e consegue dar vida a elas de várias formas.",
            "Gera ideias de forma independente.",
            "Gera ideias para melhorar algo de forma independente.",
          ],
        },
      },
      {
        habilidade: "Curiosidade",
        descritores: {
          iniciando:
            "Engaja-se com coisas novas, escuta e tenta resolver problemas básicos, geralmente com apoio.",
          desenvolvendo:
            "Começa a fazer perguntas e tentar diferentes abordagens por conta própria, com avisos ocasionais.",
          dominando:
            "Explora, indaga e experimenta de forma independente, com confiança e automotivação.",
        },
        exemplos: {
          iniciando: [
            "Vê coisas novas quando alguém mostra, mas nem sempre faz perguntas.",
            "Ouve histórias e fala sobre o que acontece, mas espera que outro faça as perguntas.",
            "Tenta uma maneira de resolver um problema; precisa de ajuda para tentar outra.",
          ],
          desenvolvendo: [
            "Explora coisas novas e às vezes faz perguntas, com incentivo.",
            "Faz perguntas simples sobre histórias; precisa de ajuda para perguntas mais profundas.",
            "Tenta mais de uma maneira de resolver um problema, com ajuda para escolher a melhor.",
          ],
          dominando: [
            "Explora coisas novas na escola e em casa, fazendo perguntas sobre o que acha interessante.",
            "Ouve histórias e faz perguntas sobre personagens e enredo.",
            "Tenta diferentes maneiras de resolver um problema e vê qual funciona melhor.",
          ],
        },
      },
    ],
  },
  {
    competencia: "Global",
    slug: "global",
    habilidades: [
      {
        habilidade: "Cidadania",
        descritores: {
          iniciando:
            "Reconhece ajudantes da comunidade, segue regras e participa de atividades de melhoria, com instruções e orientação.",
          desenvolvendo:
            "Compreende papéis dos ajudantes, cumpre regras e engaja-se em atividades com mais independência.",
          dominando:
            "Compreende plenamente os papéis, segue regras com propósito e participa ativamente de atividades que beneficiam a comunidade.",
        },
        exemplos: {
          iniciando: [
            "Cita alguns ajudantes da comunidade sem entender plenamente seu papel.",
            "Segue regras quando lembrado, sem sempre entender por que são importantes.",
            "Ajuda em atividades como reciclagem quando pedido, sem saber o porquê.",
          ],
          desenvolvendo: [
            "Nomeia diferentes ajudantes e começa a entender suas funções.",
            "Segue a maioria das regras sozinho e começa a entender seu propósito.",
            "Participa de atividades que ajudam a escola e percebe a diferença que fazem.",
          ],
          dominando: [
            "Aprende sobre ajudantes da comunidade e entende seus papéis.",
            "Segue regras da escola entendendo por que são importantes.",
            "Participa de atividades que melhoram a escola (reciclagem, limpeza).",
          ],
        },
      },
      {
        habilidade: "Ação",
        descritores: {
          iniciando:
            "Acompanha atividades, tarefas e problemas da sala, mas precisa de instruções para participar.",
          desenvolvendo:
            "Contribui de forma mais independente, compartilha ideias e identifica problemas, com apoio para soluções.",
          dominando:
            "Toma decisões de forma independente, entende o valor de sua participação e propõe soluções com confiança.",
        },
        exemplos: {
          iniciando: [
            "Acompanha atividades da sala; precisa de incentivo para compartilhar ideias.",
            "Faz suas tarefas quando lembrado, sem entender o impacto.",
            "Às vezes percebe problemas, mas precisa de ajuda para falar ou resolver.",
          ],
          desenvolvendo: [
            "Às vezes compartilha ideias; precisa de ajuda para tomar decisões em grupo.",
            "Participa das tarefas com mais independência.",
            "Fala sobre problemas e às vezes sugere soluções simples.",
          ],
          dominando: [
            "Ajuda a tomar decisões e compartilha ideias do que fazer juntos.",
            "Participa de tarefas entendendo que suas ações contribuem para a turma.",
            "Fala sobre problemas no parquinho/sala e sugere maneiras de resolvê-los.",
          ],
        },
      },
      {
        habilidade: "Compreensão Intercultural",
        descritores: {
          iniciando:
            "Começa a se envolver com diferentes culturas; precisa de ajuda para entender e falar sobre elas.",
          desenvolvendo:
            "Compreende e compartilha fatos culturais, discute a vida em outros lugares e é gentil com colegas.",
          dominando:
            "Aprende, discute e aprecia diferentes culturas de forma independente, interagindo com respeito.",
        },
        exemplos: {
          iniciando: [
            "Aprende sobre países quando alguém conta; ainda não compartilha por si só.",
            "Ouve histórias de outros países; precisa de ajuda para entender.",
            "Brinca com colegas de diferentes origens; precisa de ajuda para perceber diferenças.",
          ],
          desenvolvendo: [
            "Fala alguns fatos sobre países e culturas (comidas, feriados).",
            "Ouve histórias do mundo e fala um pouco sobre como seria a vida lá.",
            "É gentil com colegas e começa a respeitar costumes diferentes.",
          ],
          dominando: [
            "Compartilha fatos sobre diferentes países e culturas (idiomas, comidas, feriados).",
            "Ouve histórias do mundo todo e fala sobre como seria a vida nesses lugares.",
            "Brinca e é gentil com colegas de origens diferentes.",
          ],
        },
      },
    ],
  },
  {
    competencia: "Digital",
    slug: "digital",
    habilidades: [
      {
        habilidade: "Alfabetização Digital",
        descritores: {
          iniciando:
            "Começa a usar dispositivos digitais com suporte significativo, precisando de instruções passo a passo.",
          desenvolvendo:
            "Usa ferramentas digitais com mais independência, com orientação para tarefas complexas.",
          dominando:
            "Usa dispositivos digitais com confiança, navega softwares e completa tarefas básicas por conta própria.",
        },
        exemplos: {
          iniciando: [
            "Usa computador/tablet para jogar ou assistir vídeos quando alguém ajuda a começar.",
            "Liga dispositivo ou aperta botões quando mostram; precisa de ajuda para abrir apps.",
            "Desenha ou escreve no dispositivo quando alguém configura.",
          ],
          desenvolvendo: [
            "Usa tablet/computador para jogos e vídeos; precisa de ajuda para escolher conteúdo educacional.",
            "Liga/desliga dispositivo, abre apps e digita palavras, com alguns lembretes.",
            "Usa software para desenhar ou escrever frases curtas, com ajuda para explorar ferramentas.",
          ],
          dominando: [
            "Usa computador/tablet para jogos e vídeos educativos.",
            "Usa funções básicas: ligar, desligar, abrir apps, digitar e desenhar.",
            "Usa software simples para aprender, desenhar ou escrever histórias.",
          ],
        },
      },
      {
        habilidade: "Responsabilidade Digital",
        descritores: {
          iniciando:
            "Começa a seguir regras digitais com lembretes; ainda não entende plenamente seu propósito.",
          desenvolvendo:
            "Compreende regras, privacidade pessoal e importância de relatar problemas, com lembretes ocasionais.",
          dominando:
            "Segue regras tecnológicas de forma independente, protege informações pessoais e relata problemas online.",
        },
        exemplos: {
          iniciando: [
            "Segue regras quando lembrado, sem entender por que são importantes.",
            "Começa a entender o que são informações pessoais; precisa de ajuda para lembrar de não compartilhar.",
            "Pode sentir desconforto com algo online, mas pode não saber que deve contar a um adulto.",
          ],
          desenvolvendo: [
            "Segue a maioria das regras sozinho e começa a entender por que.",
            "Sabe não compartilhar informações pessoais, mas pode não entender plenamente o porquê.",
            "Sabe que deve contar a um adulto sobre algo confuso online; precisa de lembretes.",
          ],
          dominando: [
            "Segue regras sobre quando e como usar tecnologia na escola e em casa.",
            "Mantém informações pessoais privadas e não compartilha online sem permissão.",
            "Conta a um professor ou pai se vê algo desconfortável ou confuso online.",
          ],
        },
      },
      {
        habilidade: "Inovação",
        descritores: {
          iniciando:
            "Apenas começando a usar ferramentas digitais e codificação com suporte significativo.",
          desenvolvendo:
            "Usa ferramentas digitais e programas de codificação com mais independência, com orientação para tarefas complexas.",
          dominando:
            "Usa ferramentas e codificação para criar projetos e resolver problemas com pouca ou nenhuma ajuda.",
        },
        exemplos: {
          iniciando: [
            "Segue instruções simples em programa de codificação por blocos com muita ajuda.",
            "Usa tablet/computador para criar algo simples quando alguém mostra como.",
            "Participa de atividades com tecnologia com instruções passo a passo.",
          ],
          desenvolvendo: [
            "Usa codificação por blocos para mover personagem ou completar tarefas, com alguma ajuda.",
            "Cria projetos simples de arte ou música; precisa de ideias para adicionar detalhes.",
            "Participa de atividades com tecnologia (ex.: desenho 3D), com ajuda para explorar ferramentas.",
          ],
          dominando: [
            "Usa programas de codificação por blocos para mover personagens ou completar tarefas simples.",
            "Ajuda a usar tablets/computadores para criar projetos simples de arte ou música.",
            "Participa de atividades em sala que envolvam tecnologia para construir (ex.: app de desenho 3D).",
          ],
        },
      },
    ],
  },
  {
    competencia: "Autoliderança",
    slug: "autolideranca",
    habilidades: [
      {
        habilidade: "Confiança",
        descritores: {
          iniciando:
            "Começa a participar de conversas e novas atividades, precisando de incentivo para ganhar confiança.",
          desenvolvendo:
            "Cresce na expressão, em tentar coisas novas e em fazer perguntas, com garantias ocasionais.",
          dominando:
            "Fala com confiança sobre interesses, tenta tarefas difíceis e faz perguntas para aprender de forma independente.",
        },
        exemplos: {
          iniciando: [
            "Fala sobre algo que gosta quando perguntado; pode se sentir tímido para compartilhar sozinho.",
            "Hesita em tentar novas atividades difíceis; precisa de muito incentivo.",
            "Sente-se inseguro ao fazer perguntas; espera que outros expliquem.",
          ],
          desenvolvendo: [
            "Fala sobre algo que gosta com algum incentivo.",
            "Tenta novas atividades, mesmo difíceis; precisa de apoio para continuar.",
            "Faz perguntas quando não entende, com incentivo.",
          ],
          dominando: [
            "Fala com outras pessoas sobre um assunto que gosta ou algo que fez.",
            "Experimenta novas atividades, mesmo que pareçam difíceis no começo.",
            "Faz perguntas quando não entende, mostrando interesse em aprender mais.",
          ],
        },
      },
      {
        habilidade: "Aprender a Aprender",
        descritores: {
          iniciando:
            "Começa a refletir sobre o aprendizado, resolver problemas e pedir ajuda, com estímulos e apoio.",
          desenvolvendo:
            "Progresso em falar sobre aprendizado e explicar como resolveu problemas, com alguma orientação.",
          dominando:
            "Reflete e fala de forma independente sobre seu aprendizado e usa feedback para melhorar sem muita solicitação.",
        },
        exemplos: {
          iniciando: [
            "Mostra o que aprendeu quando perguntado; precisa de ajuda para refletir sobre o que gostou ou achou difícil.",
            "Mostra como resolveu um problema; precisa de ajuda para explicar os passos.",
            "Inseguro ao pedir ajuda; precisa de lembretes para pedir.",
          ],
          desenvolvendo: [
            "Fala sobre o que aprendeu e às vezes diz o que achou fácil/difícil, com incentivo.",
            "Explica como resolveu um problema; precisa de lembretes para todos os passos.",
            "Pede ajuda quando não entende; precisa de orientação para usar feedback.",
          ],
          dominando: [
            "Fala o que aprendeu e o que achou fácil ou difícil (dificuldade boa/nenhuma/ruim).",
            "Explica como resolveu um problema, incluindo o que fez quando ficou difícil.",
            "Pede ajuda quando não entende e usa feedback para melhorar na próxima vez.",
          ],
        },
      },
      {
        habilidade: "Bem-estar",
        descritores: {
          iniciando:
            "Começa a reconhecer e expressar emoções, praticar atividades físicas e seguir rotinas, com lembretes de adultos.",
          desenvolvendo:
            "Progresso em falar sobre emoções, manter-se ativo e seguir rotinas com mais independência.",
          dominando:
            "Fala independentemente sobre sentimentos, mantém-se fisicamente ativo e segue rotinas com consistência.",
        },
        exemplos: {
          iniciando: [
            "Demonstra como se sente pelo comportamento; precisa de ajuda para falar sobre sentimentos.",
            "Participa de atividade física quando incentivado.",
            "Segue rotinas (lavar mãos, escovar dentes) quando adultos lembram.",
          ],
          desenvolvendo: [
            "Fala sobre sentimentos (feliz, triste) com incentivo.",
            "Participa de atividades físicas na maioria das vezes, com lembretes.",
            "Segue rotinas diárias com menos lembretes.",
          ],
          dominando: [
            "Fala sobre sentimentos com professor ou família quando está feliz ou triste.",
            "Participa de atividades físicas e mantém-se ativo.",
            "Segue rotinas: lavar mãos, escovar dentes, preparar-se para dormir.",
          ],
        },
      },
    ],
  },
  {
    competencia: "Interpessoal",
    slug: "interpessoal",
    habilidades: [
      {
        habilidade: "Socioemocional",
        descritores: {
          iniciando:
            "Começa a reconhecer e expressar sentimentos, seguir regras e comunicar necessidades, com lembretes.",
          desenvolvendo:
            "Identifica emoções, segue regras e expressa necessidades com mais independência.",
          dominando:
            "Identifica emoções em si e nos outros, entende o propósito das regras e comunica sentimentos respeitosamente.",
        },
        exemplos: {
          iniciando: [
            "Diz quando está feliz, triste ou bravo; precisa de ajuda para nomear outras emoções.",
            "Segue regras quando lembrado, sem entender plenamente.",
            'Diz como se sente com palavras simples ("estou bravo"); precisa de ajuda para ser respeitoso.',
          ],
          desenvolvendo: [
            "Nomeia seus sentimentos e reconhece os dos outros; precisa de ajuda para emoções complexas.",
            "Segue regras na maior parte e começa a entender que ajudam a todos.",
            "Explica como se sente e pede o que precisa; precisa de ajuda com o tom.",
          ],
          dominando: [
            "Identifica e nomeia seus sentimentos e os sentimentos dos outros.",
            "Segue regras da sala e entende por que são importantes.",
            "Usa palavras para dizer como se sente e pedir o que precisa de forma respeitosa.",
          ],
        },
      },
      {
        habilidade: "Comunicação",
        descritores: {
          iniciando:
            "Começa a expressar pensamentos, ouvir e descrever, com orientação significativa para clareza.",
          desenvolvendo:
            "Melhora em clareza, audição e estrutura de frases, com apoio ocasional.",
          dominando:
            "Comunica pensamentos de forma clara, ouve atentamente, faz perguntas e usa frases completas.",
        },
        exemplos: {
          iniciando: [
            "Compartilha pensamentos de forma curta ou pouco clara; precisa de ajuda para explicar.",
            "Ouve outros falando; precisa de lembretes para focar e nem sempre faz perguntas.",
            "Descreve algo com frases curtas; precisa de ajuda para explicar tudo.",
          ],
          desenvolvendo: [
            "Compartilha ideias com mais clareza; precisa de lembretes para falar ou manter o tópico.",
            "Ouve com atenção e às vezes faz perguntas; precisa de ajuda para pensar no que perguntar.",
            "Conta uma história ou descreve imagem com frases; precisa de lembretes para frases completas.",
          ],
          dominando: [
            "Compartilha pensamentos e ideias com colegas e professores de maneira clara.",
            "Ouve atentamente e mostra que entendeu fazendo perguntas.",
            "Conta uma história ou descreve uma imagem usando frases completas.",
          ],
        },
      },
      {
        habilidade: "Colaboração",
        descritores: {
          iniciando:
            "Começa a participar de atividades em grupo, com lembretes para compartilhar, revezar e seguir regras.",
          desenvolvendo:
            "Participação mais independente, contribuindo com ideias e seguindo regras com menos instruções.",
          dominando:
            "Trabalha colaborativamente com orientação mínima, ouvindo, contribuindo e seguindo regras.",
        },
        exemplos: {
          iniciando: [
            "Ouve ideias dos amigos; precisa de ajuda para pensar e compartilhar as suas.",
            "Trabalha em projeto com outros; precisa de ajuda para revezar e compartilhar.",
            "Segue regras de um jogo; precisa de lembretes ou ajuda para entender.",
          ],
          desenvolvendo: [
            "Ouve ideias dos amigos e às vezes acrescenta as suas.",
            "Trabalha com outros e às vezes lembra de revezar e compartilhar.",
            "Segue regras em jogos; precisa de lembretes para manter o foco.",
          ],
          dominando: [
            "Ouve as ideias dos amigos e acrescenta as suas quando trabalham juntos.",
            "Trabalha em projeto de grupo, revezando-se e compartilhando materiais.",
            "Segue as regras quando jogam ou fazem atividades juntos.",
          ],
        },
      },
    ],
  },
];
