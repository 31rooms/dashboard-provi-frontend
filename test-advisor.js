const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAIN_PIPELINES = [12290640, 12535008, 12535020];

const ETAPA_IDS = {
  para_seguimiento_manual: [96360112, 96820676, 97024316],
  en_seguimiento_manual: [96579384, 96820680, 97024320],
  cita_agendada: [95364568, 96820684, 97024324],
  cancelacion_no_show: [95364572, 96820688, 97024328],
  negociacion_activa: [95364580, 96820692, 97024332],
  apartado_realizado: [95538088, 96820696, 97024336],
  cliente_futuro: [98428743, 98428719, 98428767],
};

async function testAdvisorPerformance() {
  const { data: leadsData, error } = await supabase
    .from('leads')
    .select('id, responsible_user_name, pipeline_name, status_id')
    .in('pipeline_id', MAIN_PIPELINES)
    .is('closed_at', null);

  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total leads fetched:', leadsData.length);
  
  const performanceMap = {};
  
  leadsData.forEach(lead => {
    const asesor = lead.responsible_user_name || 'Sin asignar';
    const key = asesor;
    
    if (!performanceMap[key]) {
      performanceMap[key] = {
        asesor,
        total_leads: 0,
        para_seguimiento_manual: 0,
        en_seguimiento_manual: 0,
        cita_agendada: 0,
        cancelacion_no_show: 0,
        negociacion_activa: 0,
        apartado_realizado: 0,
        cliente_futuro: 0
      };
    }
    
    performanceMap[key].total_leads++;
    
    const statusId = lead.status_id;
    
    if (ETAPA_IDS.para_seguimiento_manual.includes(statusId)) {
      performanceMap[key].para_seguimiento_manual++;
    } else if (ETAPA_IDS.en_seguimiento_manual.includes(statusId)) {
      performanceMap[key].en_seguimiento_manual++;
    } else if (ETAPA_IDS.cita_agendada.includes(statusId)) {
      performanceMap[key].cita_agendada++;
    } else if (ETAPA_IDS.cancelacion_no_show.includes(statusId)) {
      performanceMap[key].cancelacion_no_show++;
    } else if (ETAPA_IDS.negociacion_activa.includes(statusId)) {
      performanceMap[key].negociacion_activa++;
    } else if (ETAPA_IDS.apartado_realizado.includes(statusId)) {
      performanceMap[key].apartado_realizado++;
    } else if (ETAPA_IDS.cliente_futuro.includes(statusId)) {
      performanceMap[key].cliente_futuro++;
    }
  });
  
  console.log('\nAdvisor Performance:');
  console.log('----------------------------------------------');
  Object.values(performanceMap)
    .sort((a, b) => b.total_leads - a.total_leads)
    .slice(0, 10)
    .forEach(p => {
      console.log(p.asesor + ':');
      console.log('  Total:', p.total_leads, '| Para Seg:', p.para_seguimiento_manual, '| En Seg:', p.en_seguimiento_manual);
      console.log('  Cita:', p.cita_agendada, '| Cancel:', p.cancelacion_no_show, '| Negoc:', p.negociacion_activa);
      console.log('  Apart:', p.apartado_realizado, '| Cli.Fut:', p.cliente_futuro);
    });
}

testAdvisorPerformance();
