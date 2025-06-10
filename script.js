// script.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calculadora-form');
  const secaoResultado = document.getElementById('resultado-calculo');
  const graficosContainer = document.getElementById('graficos-resultado-container');
  const btnVerPayback = document.getElementById('btn-ver-payback');

  // referências dos spans de resultado
  const resInvest = document.getElementById('resultado-investimento');
  const resEconMes = document.getElementById('resultado-economia-mes');
  const resEconTot = document.getElementById('resultado-economia-total');
  const resPayback = document.getElementById('resultado-payback');
  const resCo2 = document.getElementById('resultado-co2');
  const resArvores = document.getElementById('resultado-arvores');
  const resKm = document.getElementById('resultado-km-carro');
  const resPot = document.getElementById('resultado-potencia');
  const resPainel = document.getElementById('resultado-paineis');
  const resGeran = document.getElementById('resultado-geracao-anual');
  const resArea = document.getElementById('resultado-area');
  const resPeso = document.getElementById('resultado-peso');

  let graficoPayback;            // instancia do Chart.js
  let ultimosResultados = null;  // guardamos para usar no click do botão

  // form submit: calcula e mostra os cards
  form.addEventListener('submit', e => {
    e.preventDefault();
    // -- aqui você puxa valores de gasto, tarifa, hsp etc --
    // vamos fingir que a função calcularSimulacao retorna um objeto:
    const r = calcularSimulacao(/*gasto, tarifa, hsp*/);
    ultimosResultados = r;

    // preenche os spans
    resInvest.textContent = formatarMoeda(r.investimentoEstimado);
    resEconMes.textContent = formatarMoeda(r.economiaMensal);
    resEconTot.textContent = formatarMoeda(r.economiaTotalVidaUtil);
    resPayback.textContent = `${formatarNumero(r.paybackAnos,1)} anos`;
    resCo2.textContent = `${formatarNumero(r.co2EvitadoAnual,0)} kg`;
    resArvores.textContent = `${formatarNumero(r.arvoresEquivalentes,0)} árvores`;
    resKm.textContent = `${formatarNumero(r.kmCarroEletricoAnual,0)} km`;
    resPot.textContent = `${formatarNumero(r.potenciaSistemaKWp,2)} kWp`;
    resPainel.textContent = r.numeroPaineis;
    resGeran.textContent = `${formatarNumero(r.geracaoAnualEstimada,0)} kWh`;
    resArea.textContent = `${formatarNumero(r.areaMinima,2)} m²`;
    resPeso.textContent = `${formatarNumero(r.pesoEstimado,0)} kg`;

    secaoResultado.classList.remove('hidden');
    graficosContainer.classList.add('hidden');  // esconde o gráfico até o clique
  });

  // botão "Ver Gráfico Payback"
  btnVerPayback.addEventListener('click', () => {
    if (!ultimosResultados) return;

    const ctx = document.getElementById('graficoPaybackAcumulado').getContext('2d');

    // destrói instância anterior
    if (graficoPayback) graficoPayback.destroy();

    // dados de payback acumulado ano a ano
    const anos = Array.from({length: ultimosResultados.paybackAnos+1}, (_,i)=>i);
    const acumulado = anos.map(ano => ano * (ultimosResultados.economiaAnual || 0));

    graficoPayback = new Chart(ctx, {
      type: 'line',
      data: {
        labels: anos.map(a=>`${a} ano${a>1?'s':''}`),
        datasets: [{
          label: 'ROI acumulado (R$)',
          data: acumulado,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46,204,113,0.2)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Payback Acumulado'
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    graficosContainer.classList.remove('hidden');
    // scroll suave até o gráfico
    graficosContainer.scrollIntoView({ behavior: 'smooth' });
  });

  // ————— Funções auxiliares (formatação e cálculo) —————

  function formatarMoeda(v) {
    return new Intl.NumberFormat('pt-BR', {
      style:'currency', currency:'BRL'
    }).format(v);
  }
  function formatarNumero(v, casas) {
    return Number(v).toFixed(casas).replace('.', ',');
  }

  function calcularSimulacao() {
    // sua lógica real de cálculo aqui; retornamos um objeto de exemplo:
    return {
      investimentoEstimado: 40425,
      economiaMensal: 1300,
      economiaTotalVidaUtil: 390000,
      paybackAnos: 3,
      co2EvitadoAnual: 1086,
      arvoresEquivalentes: 151,
      kmCarroEletricoAnual: 10860,
      potenciaSistemaKWp: 11.55,
      numeroPaineis: 21,
      geracaoAnualEstimada: 15514,
      areaMinima: 52.5,
      pesoEstimado: 525,
      economiaAnual: 1300 * 12
    };
  }
});
