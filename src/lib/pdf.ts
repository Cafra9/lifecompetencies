import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentReportArgs {
  aluno: string;
  turma: string;
  radar: { competencia: string; valor: number }[];
  avals: { habilidade: string; competencia: string; nivel: string; data: string; observacao: string }[];
}

export function exportStudentReport(d: StudentReportArgs) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Relatório de Avaliação por Competências", 14, 18);
  doc.setFontSize(11);
  doc.text(`Aluno: ${d.aluno}`, 14, 28);
  doc.text(`Turma: ${d.turma}`, 14, 34);
  doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 40);

  doc.setFontSize(13);
  doc.text("Médias por Competência (escala 1–4)", 14, 52);
  autoTable(doc, {
    startY: 56,
    head: [["Competência", "Média"]],
    body: d.radar.map((r) => [r.competencia, r.valor.toFixed(2)]),
    theme: "striped",
    headStyles: { fillColor: [70, 100, 200] },
  });

  const next = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.text("Histórico de Avaliações", 14, next);
  autoTable(doc, {
    startY: next + 4,
    head: [["Data", "Competência", "Habilidade", "Nível", "Observação"]],
    body: d.avals.map((a) => [new Date(a.data).toLocaleDateString("pt-BR"), a.competencia, a.habilidade, a.nivel, a.observacao]),
    styles: { fontSize: 9, cellWidth: "wrap" },
    columnStyles: { 4: { cellWidth: 60 } },
    headStyles: { fillColor: [70, 100, 200] },
  });

  doc.save(`relatorio_${d.aluno.replace(/\s+/g, "_")}.pdf`);
}
