document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculadora-form');
    const selectEstado = document.getElementById('estado');
    const selectCidade = document.getElementById('cidade');
    const inputGastoMensal = document.getElementById('gasto-mensal');
    const outputGastoMensalValor = document.getElementById('gasto-mensal-valor');
    const inputTarifa = document.getElementById('tarifa');
    const spanConsumoEstimado = document.getElementById('consumo-estimado');
    const secaoResultado = document.getElementById('resultado-calculo');
    const botaoVerGraficoPayback = document.getElementById('ver-grafico-payback');
    const graficosResultadoContainer = document.getElementById('graficos-resultado-container');

    const resultadoInvestimento = document.getElementById('resultado-investimento');
    const resultadoEconomiaMes = document.getElementById('resultado-economia-mes');
    const resultadoEconomiaTotal = document.getElementById('resultado-economia-total');
    const resultadoPayback = document.getElementById('resultado-payback');
    const resultadoCo2 = document.getElementById('resultado-co2');
    const resultadoArvores = document.getElementById('resultado-arvores');
    const resultadoKmCarro = document.getElementById('resultado-km-carro');
    const resultadoPotencia = document.getElementById('resultado-potencia');
    const resultadoPaineis = document.getElementById('resultado-paineis');
    const resultadoGeracaoAnual = document.getElementById('resultado-geracao-anual');
    const resultadoArea = document.getElementById('resultado-area');
    const resultadoPeso = document.getElementById('resultado-peso');

    const erroEstado = document.getElementById('erro-estado');
    const erroCidade = document.getElementById('erro-cidade');
    const erroGasto = document.getElementById('erro-gasto');
    const erroTarifa = document.getElementById('erro-tarifa');

    let graficoPayback;
    let graficoConsumoGeracao;
    let resultadosCalculados;

    const dadosCidades = {
        RJ: [
            { nome: 'Rio de Janeiro', hsp: 4.55 },
            { nome: 'Niterói', hsp: 4.6 },
            { nome: 'Duque de Caxias', hsp: 4.5 }
        ],
        SP: [
            { nome: 'São Paulo', hsp: 4.7 },
            { nome: 'Campinas', hsp: 4.85 },
            { nome: 'Guarulhos', hsp: 4.65 }
        ],
        MG: [
            { nome: 'Belo Horizonte', hsp: 5.1 },
            { nome: 'Uberlândia', hsp: 5.3 },
            { nome: 'Contagem', hsp: 5.05 }
        ],
        BA: [
            { nome: 'Salvador', hsp: 5.4 },
            { nome: 'Feira de Santana', hsp: 5.35 }
        ],
        CE: [
            { nome: 'Fortaleza', hsp: 5.9 },
            { nome: 'Caucaia', hsp: 5.85 }
        ]
    };

    const POTENCIA_PAINEL_W = 550;
    const FATOR_PERDAS = 0.20;
    const AREA_POR_PAINEL_M2 = 2.5;
    const PESO_POR_PAINEL_KG = 25;
    const CUSTO_MEDIO_POR_WP_INSTALADO = 3.5;
    const FATOR_CO2_EVITADO_POR_KWH = 0.075;
    const FATOR_ARVORES_POR_TON_CO2 = 7;
    const FATOR_KM_CARRO_ELETRICO_POR_KWH = 5;
    const VIDA_UTIL_SISTEMA_ANOS = 25;
    const DIAS_NO_ANO = 365;
    const MESES_NO_ANO = 12;

    function mostrarErro(el, mensagem) {
        if (el) {
            el.textContent = mensagem;
            el.style.display = 'block';
        }
    }

    function limparErro(el) {
        if (el) {
            el.textContent = '';
            el.style.display = 'none';
        }
    }

    function limparTodosErros() {
        [erroEstado, erroCidade, erroGasto, erroTarifa].forEach(limparErro);
    }

    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarNumero = (valor, casas = 0) => valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

    function popularCidades() {
        const estado = selectEstado.value;
        selectCidade.innerHTML = '<option value="">Selecione...</option>';
        selectCidade.disabled = true;

        if (estado && dadosCidades[estado]) {
            dadosCidades[estado].forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.hsp;
                option.textContent = `${cidade.nome} (HSP: ${cidade.hsp.toFixed(2)})`;
                selectCidade.appendChild(option);
            });
            selectCidade.disabled = false;
        }
    }

    function atualizarDisplayGasto() {
        const gasto = parseFloat(inputGastoMensal.value);
        const tarifa = parseFloat(inputTarifa.value);
        outputGastoMensalValor.textContent = formatarMoeda(isNaN(gasto) ? 0 : gasto);

        if (!isNaN(gasto) && !isNaN(tarifa) && tarifa > 0) {
            const consumo = gasto / tarifa;
            spanConsumoEstimado.textContent = `${formatarNumero(consumo)} kWh`;
        } else {
            spanConsumoEstimado.textContent = '-- kWh';
        }
    }

    function validarEntradas() {
        limparTodosErros();
        let valido = true;

        if (!selectEstado.value) {
            mostrarErro(erroEstado, 'Selecione o estado.');
            valido = false;
        }
        if (!selectCidade.value) {
            mostrarErro(erroCidade, 'Selecione a cidade.');
            valido = false;
        }
        const gasto = parseFloat(inputGastoMensal.value);
        if (isNaN(gasto) || gasto <= 0) {
            mostrarErro(erroGasto, 'Informe um gasto mensal válido.');
            valido = false;
        }
        const tarifa = parseFloat(inputTarifa.value);
        if (isNaN(tarifa) || tarifa <= 0) {
            mostrarErro(erroTarifa, 'Informe uma tarifa válida.');
            valido = false;
        }
        return valido;
    }

    function calcularSimulacao(gasto, tarifa, hsp) {
        const consumoMensal = gasto / tarifa;
        if (consumoMensal <= 0) return null;

        const energiaDiariaNecessaria = consumoMensal / (DIAS_NO_ANO / MESES_NO_ANO);
        const energiaDiariaCorrigida = energiaDiariaNecessaria / (1 - FATOR_PERDAS);
        const potenciaSistemaKWp = energiaDiariaCorrigida / hsp;
        const numeroPaineis = Math.ceil((potenciaSistemaKWp * 1000) / POTENCIA_PAINEL_W);
        const areaMinima = numeroPaineis * AREA_POR_PAINEL_M2;
        const pesoEstimado = numeroPaineis * PESO_POR_PAINEL_KG;

        const geracaoAnualEstimada = potenciaSistemaKWp * hsp * DIAS_NO_ANO * (1 - FATOR_PERDAS);
        const geracaoMensalEstimada = geracaoAnualEstimada / MESES_NO_ANO;
        const economiaMensal = Math.min(geracaoMensalEstimada, consumoMensal) * tarifa;
        const economiaAnual = economiaMensal * MESES_NO_ANO;
        const economiaTotalVidaUtil = economiaAnual * VIDA_UTIL_SISTEMA_ANOS;
        const investimentoEstimado = potenciaSistemaKWp * 1000 * CUSTO_MEDIO_POR_WP_INSTALADO;
        const paybackAnos = investimentoEstimado > 0 && economiaAnual > 0 ? investimentoEstimado / economiaAnual : 0;

        const co2EvitadoAnual = geracaoAnualEstimada * FATOR_CO2_EVITADO_POR_KWH;
        const co2EvitadoTotal = co2EvitadoAnual * VIDA_UTIL_SISTEMA_ANOS;
        const arvoresEquivalentes = (co2EvitadoTotal / 1000) * FATOR_ARVORES_POR_TON_CO2;
        const kmCarroEletricoAnual = geracaoAnualEstimada * FATOR_KM_CARRO_ELETRICO_POR_KWH;

        return {
            potenciaSistemaKWp,
            numeroPaineis,
            areaMinima,
            pesoEstimado,
            geracaoAnualEstimada,
            geracaoMensalEstimada,
            economiaMensal,
            economiaAnual,
            economiaTotalVidaUtil,
            investimentoEstimado,
            paybackAnos,
            co2EvitadoAnual,
            arvoresEquivalentes,
            kmCarroEletricoAnual,
            consumoMensal
        };
    }

    function exibirResultados(r) {
        if (!r) return;
        resultadosCalculados = r;

        resultadoInvestimento.textContent = formatarMoeda(r.investimentoEstimado);
        resultadoEconomiaMes.textContent = formatarMoeda(r.economiaMensal);
        resultadoEconomiaTotal.textContent = formatarMoeda(r.economiaTotalVidaUtil);
        resultadoPayback.textContent = r.paybackAnos > 0 ? `${formatarNumero(r.paybackAnos, 1)} anos` : '--';
        resultadoCo2.textContent = `${formatarNumero(r.co2EvitadoAnual, 0)} kg`;
        resultadoArvores.textContent = `${formatarNumero(r.arvoresEquivalentes, 0)} árvores`;
        resultadoKmCarro.textContent = `${formatarNumero(r.kmCarroEletricoAnual, 0)} km`;
        resultadoPotencia.textContent = `${formatarNumero(r.potenciaSistemaKWp, 2)} kWp`;
        resultadoPaineis.textContent = r.numeroPaineis;
        resultadoGeracaoAnual.textContent = `${formatarNumero(r.geracaoAnualEstimada, 0)} kWh`;
        resultadoArea.textContent = `${formatarNumero(r.areaMinima, 2)} m²`;
        resultadoPeso.textContent = `${formatarNumero(r.pesoEstimado, 0)} kg`;
 1b77il-codex/adicionar-gráficos-de-payback
        atualizarGraficoConsumoGeracao(r.consumoMensal, r.geracaoMensalEstimada);
        atualizarGraficoPayback(r.investimentoEstimado, r.economiaAnual, r.paybackAnos);

 main
        secaoResultado.classList.remove('hidden');
        graficosResultadoContainer.classList.remove('hidden');
        secaoResultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function atualizarGraficoConsumoGeracao(consumo, geracao) {
        const ctx = document.getElementById('graficoConsumoGeracao')?.getContext('2d');
        if (!ctx) return;
        const data = {
            labels: ['Consumo Médio (kWh)', 'Geração Estimada (kWh)'],
            datasets: [{
                data: [consumo.toFixed(0), geracao.toFixed(0)],
                backgroundColor: ['rgba(231,76,60,0.7)', 'rgba(46,204,113,0.7)'],
                borderColor: ['#e74c3c', '#2ecc71'],
                borderWidth: 1
            }]
        };
        const config = { type: 'doughnut', data, options: { responsive: true, plugins: { legend: { position: 'top' } } } };
        if (graficoConsumoGeracao) graficoConsumoGeracao.destroy();
        graficoConsumoGeracao = new Chart(ctx, config);
    }

    function atualizarGraficoPayback(investimento, economiaAnual, paybackAnos) {
        const ctx = document.getElementById('graficoPaybackAcumulado')?.getContext('2d');
        if (!ctx || investimento <= 0 || economiaAnual <= 0) return;
        const anos = Math.max(Math.ceil(paybackAnos) + 3, 10);
        const labels = Array.from({ length: anos + 1 }, (_, i) => `Ano ${i}`);
        const dadosInvestimento = Array(anos + 1).fill(investimento);
        const dadosEconomiaAcumulada = labels.map((_, i) => Math.min(economiaAnual * i, investimento * 1.5));
        const dadosSaldo = labels.map((_, i) => (economiaAnual * i) - investimento);

        const data = {
            labels,
            datasets: [
                { label: 'Investimento (R$)', data: dadosInvestimento, borderColor: 'rgba(231,76,60,0.8)', borderDash: [5,5], type: 'line', fill: false, pointRadius: 0 },
                { label: 'Economia Acumulada (R$)', data: dadosEconomiaAcumulada, borderColor: 'rgba(46,204,113,0.8)', backgroundColor: 'rgba(46,204,113,0.2)', type: 'line', fill: true, tension: 0.1 },
                { label: 'Saldo (R$)', data: dadosSaldo, borderColor: 'rgba(54,162,235,0.8)', backgroundColor: 'rgba(54,162,235,0.2)', type: 'bar' }
            ]
        };
        const config = {
            type: 'line',
            data,
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Payback e Economia Acumulada ao Longo dos Anos' },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: { y: { beginAtZero: false, ticks: { callback: value => formatarMoeda(value) } } }
            }
        };
        if (graficoPayback) graficoPayback.destroy();
        graficoPayback = new Chart(ctx, config);
    }

    selectEstado.addEventListener('change', popularCidades);
    inputGastoMensal.addEventListener('input', atualizarDisplayGasto);
    inputTarifa.addEventListener('input', atualizarDisplayGasto);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validarEntradas()) {
            const gasto = parseFloat(inputGastoMensal.value);
            const tarifa = parseFloat(inputTarifa.value);
            const hsp = parseFloat(selectCidade.value);
            const resultados = calcularSimulacao(gasto, tarifa, hsp);
            exibirResultados(resultados);
        } else {
            secaoResultado.classList.add('hidden');
        }
    });

    botaoVerGraficoPayback?.addEventListener('click', () => {
        graficosResultadoContainer.classList.toggle('hidden');
        if (!graficosResultadoContainer.classList.contains('hidden')) {
            if (resultadosCalculados) {
                atualizarGraficoConsumoGeracao(resultadosCalculados.consumoMensal, resultadosCalculados.geracaoMensalEstimada);
                atualizarGraficoPayback(resultadosCalculados.investimentoEstimado, resultadosCalculados.economiaAnual, resultadosCalculados.paybackAnos);
            }
            graficosResultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    popularCidades();
    atualizarDisplayGasto();
});
