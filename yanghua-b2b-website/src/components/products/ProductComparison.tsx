'use client';
import React from 'react';
import type { Locale } from '@/lib/i18n';

export default function ProductComparison({ locale }: { locale: Locale }) {
  const isEs = locale === 'es';

  const t = {
    section1Title: isEs
      ? 'Barra Flexible Yanghua STI vs Soluciones Tradicionales'
      : 'Yanghua STI Flexible Busbar vs Traditional Solutions',
    section2Title: isEs
      ? 'Barra Flexible vs Barra Compacta'
      : 'Flexible Busbar vs Compact Busbar',
    category: isEs ? 'Categoría' : 'Category',
    flexibleBusbar: isEs ? 'Barra Flexible' : 'Flexible Busbar',
    multipleCables: isEs ? 'Múltiples Cables' : 'Multiple Cables',
    compactBusbar: isEs ? 'Barra Compacta' : 'Compact Busbar',
    rows1: [
      {
        c: isEs ? 'Rendimiento' : 'Performance',
        a: isEs
          ? 'Buena consistencia de resistencia y baja generación de calor'
          : 'Good resistance consistency and low heat generation',
        b: isEs
          ? 'Cada resistencia difiere, el flujo de corriente varía y es propenso al calentamiento'
          : 'Each resistor has a different value, resulting in differences in current flow and making it prone to heating',
      },
      {
        c: isEs ? 'Instalación' : 'Installation',
        a: isEs
          ? 'Tamaño pequeño, estructura compacta, instalación sencilla; Conector en T especializado con alta seguridad'
          : 'Small size, compact structure, easy installation; Specialized T-connector with high safety factor',
        b: isEs
          ? 'Gran volumen y peso, uniones difíciles de manejar, riesgos de seguridad'
          : 'Multi splicing has a large volume and weight, and the joints are difficult to handle, which poses certain safety hazards',
      },
      {
        c: isEs ? 'Capacidad' : 'Capacity',
        a: isEs
          ? 'Capacidad de 200-6300A sin necesidad de reducción'
          : 'The product has a current carrying capacity of 200-6300A and does not require derating',
        b: isEs
          ? 'Capacidad pequeña por unidad, requiere múltiples empalmes y reducción de capacidad'
          : 'A single unit has a small current carrying capacity and requires multiple splicing and capacity reduction for use',
      },
      {
        c: isEs ? 'Coste Global' : 'Overall Cost',
        a: isEs
          ? 'Alta densidad de corriente, ahorro de cobre, mayor relación coste-eficacia'
          : 'High current density, significant copper savings, and higher cost-effectiveness',
        b: isEs
          ? 'Baja densidad de corriente, mayor consumo de cobre, menor relación coste-eficacia'
          : 'Low current density, more copper is used, and the cost-effectiveness is lower',
      },
    ],
    rows2: [
      {
        c: isEs ? 'Forma y Volumen' : 'Shape and Volume',
        a: isEs ? 'Ordenado, compacto y claro' : 'Neat, tight and clear',
        b: isEs ? 'Ocupa mucho espacio de instalación' : 'It takes up a lot of installation space',
      },
      {
        c: isEs ? 'Capacidad de Sobrecarga' : 'Overload Capacity',
        a: isEs
          ? 'A 135K de aumento y 40°C ambiente, soporta >33%'
          : 'When the temperature rises by 135K and the surrounding environment temperature is 40°C, the overload capacity can withstand more than 33%',
        b: isEs
          ? 'A 70K de aumento y 30°C ambiente, soporta 15%'
          : 'When the temperature rises by 70K and the surrounding environment temperature is 30°C, the overload capacity can withstand 15%',
      },
      {
        c: isEs ? 'Construcción e Instalación' : 'Installation and Construction',
        a: isEs
          ? 'Montaje in situ fácil, instalación y desmontaje sencillos, reordenable; Se pueden modificar derivaciones con el circuito principal energizado'
          : 'The on-site assembly of flexible busbar is easy to construct, easy to install and disassemble, and can be rearranged as needed. The branch circuit can be modified without affecting the overall power supply when the main circuit is live',
        b: isEs
          ? 'Requiere pre-ensamblado en fábrica, alta dificultad; Ante cambios, debe retornarse a fábrica; Baja reutilización, no permite derivaciones en vivo'
          : 'Need to assemble in factory in advance, and the construction difficulty is high. If there is design change happens on site, products need to be returned to the factory. Low reuse rate, unable to carry out live branch operations',
      },
      {
        c: isEs ? 'Gestión de Emergencias' : 'Emergency Management',
        a: isEs
          ? 'Respaldo de emergencia para fallos; Caja de conversión de circuito de respaldo restaura energía rápidamente'
          : 'Emergency backup can be used in case of system failure, utilizing the backup circuit conversion box can quickly restore power supply and improve system power supply stability',
        b: isEs
          ? 'Debido a accidentes, el mantenimiento requiere corte de energía, difícil restaurar a tiempo'
          : 'Due to an accident requiring power outage for maintenance, it is impossible to restore power supply in a timely manner',
      },
      {
        c: isEs ? 'Pérdidas y Consumo' : 'Line Loss and Energy Consumption',
        a: isEs
          ? 'Baja elevación de temperatura, bajo consumo, ahorro energético; Más ventajoso en altas corrientes'
          : 'Low temperature rise, low energy consumption, energy-saving, and the larger the current specification, the more superior its energy consumption value is displayed',
        b: isEs
          ? 'Mala disipación térmica, altas pérdidas y consumo >20%'
          : 'Poor heat dissipation, high line loss, and energy consumption exceeding 20%',
      },
    ],
  };

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Comparison</h2>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
        <h3 className="text-xl font-semibold text-gray-900 p-4 bg-gray-50">{t.section1Title}</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.category}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.flexibleBusbar}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.multipleCables}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {t.rows1.map((row, i) => (
              <tr key={`r1-${i}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.c}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{row.a}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-xl font-semibold text-gray-900 p-4 bg-gray-50">{t.section2Title}</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.category}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.flexibleBusbar}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.compactBusbar}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {t.rows2.map((row, i) => (
              <tr key={`r2-${i}`} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.c}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{row.a}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

