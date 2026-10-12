// Six statements, order fixed. 1–3 regulation, 4–6 promotion.
export const STATEMENTS = [
  { id: 1, axis: 'regulation',
    es: 'Debería prohibirse desarrollar IA más capaz que los humanos.',
    en: 'Developing AI more capable than humans should be banned.' },
  { id: 2, axis: 'regulation',
    es: 'Las empresas de IA deberían responder legalmente cuando su modelo incita a un suicidio o ayuda a cometer un crimen grave.',
    en: 'AI companies should be legally liable when their model encourages a suicide or helps commit a serious crime.' },
  { id: 3, axis: 'regulation',
    es: 'Debería ser obligatorio marcar las imágenes y videos hechos con IA.',
    en: 'Labeling AI-generated images and videos should be mandatory.' },
  { id: 4, axis: 'promotion',
    es: 'Mi gobierno debería invertir dinero público en centros de datos y cómputo para IA.',
    en: 'My government should invest public money in data centers and compute for AI.' },
  { id: 5, axis: 'promotion',
    es: 'Mi gobierno debería dar incentivos económicos a las empresas que adopten IA.',
    en: 'My government should give companies financial incentives to adopt AI.' },
  { id: 6, axis: 'promotion',
    es: 'Mi gobierno debería pagar formación en IA para estudiantes y trabajadores.',
    en: 'My government should pay for AI training for students and workers.' },
]

export const ANSWERS = [
  { value: 0,   icon: 'strongly-against', es: 'Completamente en contra', en: 'Strongly disagree' },
  { value: 25,  icon: 'against',          es: 'En contra',               en: 'Disagree' },
  { value: 50,  icon: 'neutral',          es: 'Neutro',                  en: 'Neutral' },
  { value: 75,  icon: 'favor',            es: 'A favor',                 en: 'Agree' },
  { value: 100, icon: 'strongly-favor',   es: 'Completamente a favor',   en: 'Strongly agree' },
]
