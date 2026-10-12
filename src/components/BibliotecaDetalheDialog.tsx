import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_SKILLS, LEARNING_FIRST_DESIGN, MODELO_PLANO, PLANO_EXEMPLO } from "@/lib/iSP-content";
import { competencyColor } from "@/lib/competencies";
import { RUBRICA_INFANTIL, SEGMENTOS } from "@/lib/rubrica-infantil";

export type BibliotecaRecurso = "framework" | "rubricas" | "templates";

const META: Record<BibliotecaRecurso, { title: string; description: string }> = {
  framework: {
    title: "Framework ISP",
    description: "Cinco competências e habilidades detalhadas",
  },
  rubricas: {
    title: "Rubricas por estágio",
    description: "Stage 1 (4–7) · Stage 2 (8–11) · Stage 3 (12–14) · Stage 4 (15–18)",
  },
  templates: {
    title: "Templates KSU",
    description: "Conhecimento · Habilidade · Compreensão alinhados ao Big 5",
  },
};

export function BibliotecaDetalheDialog({
  recurso,
  open,
  onOpenChange,
}: {
  recurso: BibliotecaRecurso | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recurso ? META[recurso].title : ""}</DialogTitle>
          <DialogDescription>{recurso ? META[recurso].description : ""}</DialogDescription>
        </DialogHeader>
        {recurso === "framework" && <FrameworkDetalhe />}
        {recurso === "rubricas" && <RubricasDetalhe />}
        {recurso === "templates" && <TemplatesDetalhe />}
      </DialogContent>
    </Dialog>
  );
}

function FrameworkDetalhe() {
  return (
    <div className="space-y-4">
      {Object.entries(FRAMEWORK_SKILLS).map(([slug, subs]) => {
        const col = competencyColor(slug);
        return (
          <div key={slug} className={`${col.soft} rounded-lg p-4 space-y-3`}>
            <h3 className={`font-semibold ${col.text}`}>{labelCompetencia(slug)}</h3>
            {Object.entries(subs).map(([sub, skills]) => (
              <div key={sub} className="bg-background/60 rounded-md p-3">
                <p className="text-sm font-medium mb-2">{sub}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="font-normal text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const COMPETENCIA_LABEL: Record<string, string> = {
  interpessoal: "Interpessoal",
  cognitiva: "Cognitiva",
  global: "Global",
  digital: "Digital",
  autolideranca: "Autoliderança",
};
const labelCompetencia = (slug: string) => COMPETENCIA_LABEL[slug] ?? slug;

function RubricasDetalhe() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Stage 1 · Educação Infantil (4–7 anos)</h3>
          <p className="text-xs text-muted-foreground">Rubrica iSP Life Competencies — ISP Life Competencies Brochure (páginas 10–19)</p>
        </div>
        {RUBRICA_INFANTIL.map((comp) => (
          <div key={comp.competencia} className="space-y-2">
            <p className="font-medium text-sm">{comp.competencia}</p>
            {comp.habilidades.map((h) => (
              <div key={h.habilidade} className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">{h.habilidade}</p>
                <div className="grid gap-2 md:grid-cols-3 text-xs">
                  <div className="rounded bg-muted/60 p-2">
                    <p className="font-semibold mb-1">Iniciando</p>
                    <p className="text-muted-foreground">{h.descritores.iniciando}</p>
                  </div>
                  <div className="rounded bg-muted/60 p-2">
                    <p className="font-semibold mb-1">Desenvolvendo</p>
                    <p className="text-muted-foreground">{h.descritores.desenvolvendo}</p>
                  </div>
                  <div className="rounded bg-muted/60 p-2">
                    <p className="font-semibold mb-1">Dominando</p>
                    <p className="text-muted-foreground">{h.descritores.dominando}</p>
                  </div>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-primary">Exemplos por nível</summary>
                  <div className="grid gap-2 md:grid-cols-3 mt-2">
                    {(["iniciando", "desenvolvendo", "dominando"] as const).map((n) => (
                      <div key={n}>
                        <p className="font-semibold mb-1">{n === "iniciando" ? "Iniciando" : n === "desenvolvendo" ? "Desenvolvendo" : "Dominando"}</p>
                        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                          {h.exemplos[n].map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Outros estágios</p>
        {SEGMENTOS.filter((s) => !s.disponivel).map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>
              Stage {s.estagio} · {s.label} ({s.idade})
            </span>
            <Badge variant="outline" className="font-normal">
              Em breve
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesDetalhe() {
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="font-semibold">Modelo de plano (KSU)</h3>
        <div className="flex flex-wrap gap-1.5">
          {MODELO_PLANO.map((c) => (
            <Badge key={c} variant="secondary" className="font-normal">
              {c}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Design “Learning First”</h3>
        <ol className="space-y-2">
          {LEARNING_FIRST_DESIGN.map((p) => (
            <li key={p.passo} className="rounded-md border p-3 text-sm">
              <p className="font-medium">
                {p.passo}. {p.titulo}
              </p>
              <p className="text-muted-foreground mt-0.5">{p.descricao}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">Exemplo de plano de aula</h3>
        <div className="rounded-lg border p-4 space-y-3 text-sm">
          <div>
            <p className="font-medium">{PLANO_EXEMPLO.titulo}</p>
            <p className="text-muted-foreground">{PLANO_EXEMPLO.descricao}</p>
          </div>
          <div>
            <p className="font-medium mb-1">Objetivos</p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
              {PLANO_EXEMPLO.objetivos.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Momentos da aula</p>
            <ul className="space-y-1.5">
              {PLANO_EXEMPLO.momentos.map((m, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{m.titulo}: </span>
                  {m.texto}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Life Competencies trabalhadas</p>
            <ul className="space-y-1">
              {PLANO_EXEMPLO.lcs.map((lc, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{lc.comp}: </span>
                  {lc.desc}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
