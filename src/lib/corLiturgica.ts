export function getCorLiturgica(tempo: string | undefined | null): string {
  if (!tempo) return '#B7791F'; // Fallback -> cor dourada padrão
  
  const t = tempo.toLowerCase();
  
  if (t.includes('páscoa') || t.includes('pascoa') || t.includes('natal')) {
    return '#B7791F'; // dourada
  }
  
  if (t.includes('comum') || t.includes('ordinário') || t.includes('ordinario')) {
    return '#2D6A4F'; // verde
  }
  
  if (t.includes('quaresma') || t.includes('advento')) {
    return '#6B3FA0'; // roxa
  }
  
  if (t.includes('pentecostes')) {
    return '#C0392B'; // vermelha
  }
  
  return '#B7791F'; // Fallback
}

export function getCorLiturgicaLight(tempo: string | undefined | null): string {
  const cor = getCorLiturgica(tempo);
  return `${cor}33`; // 20% opacidade
}
