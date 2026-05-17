import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen } from "lucide-react";
import {
  RUBRICA_INFANTIL,
  SEGMENTOS,
  NIVEL_LABEL,
  type Nivel,
} from "@/lib/rubrica-infantil";

export const Route = createFileRoute("/avaliacoes/rubrica")({
  component: RubricaPage,
});

const NIVEIS: Nivel[] = ["iniciando", "desenvolvendo", "dominando"];

const NIVEL_STYLE: Record<Nivel, string> = {
  iniciando: "bg-amber-100 text-amber-800 border-amber-200",
  desenvolvendo: "bg-blue-100 text-blue-800 border-blue-200",
  dominando: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function RubricaPage() {
  const [segmento, setSegmento] = useState<string>("infantil");
  const seg = SEGMENTOS.find((s) => s.id === segmento)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/avaliacoes" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Avaliações
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Rubrica de Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Quadro referencial iSP Life Competencies — descritores e exemplos por nível de desenvolvimento.
          </p>
        </div>
        <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" /> Estágio {seg.estagio}</Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {SEGMENTOS.map((s) => (
              <Button
                key={s.id}
                variant={s.id === segmento ? "default" : "outline"}
                size="sm"
                disabled={!s.disponivel}
                onClick={() => setSegmento(s.id)}
                className="gap-2"
              >
                {s.label}
                <span className="text-xs opacity-70">({s.idade})</span>
                {!s.disponivel && <span className="text-[10px] opacity-70">em breve</span>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {seg.disponivel ? (
        <Tabs defaultValue={RUBRICA_INFANTIL[0].slug}>
          <TabsList className="flex flex-wrap h-auto">
            {RUBRICA_INFANTIL.map((c) => (
              <TabsTrigger key={c.slug} value={c.slug}>{c.competencia}</TabsTrigger>
            ))}
          </TabsList>

          {RUBRICA_INFANTIL.map((c) => (
            <TabsContent key={c.slug} value={c.slug} className="space-y-6 mt-4">
              {c.habilidades.map((h) => (
                <Card key={h.habilidade}>
                  <CardHeader>
                    <CardTitle className="text-lg">{h.habilidade}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      {NIVEIS.map((n) => (
                        <div key={n} className={`rounded-md border p-3 ${NIVEL_STYLE[n]}`}>
                          <div className="text-xs font-semibold uppercase tracking-wide mb-1">{NIVEL_LABEL[n]}</div>
                          <p className="text-sm leading-relaxed">{h.descritores[n]}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Exemplos observáveis</div>
                      <div className="grid md:grid-cols-3 gap-3">
                        {NIVEIS.map((n) => (
                          <div key={n} className="rounded-md border bg-muted/30 p-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                              {NIVEL_LABEL[n]}
                            </div>
                            <ul className="space-y-1.5 text-sm list-disc list-inside text-foreground/90">
                              {h.exemplos[n].map((ex, i) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Rubrica para {seg.label} ainda não cadastrada.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
