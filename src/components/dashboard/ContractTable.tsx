"use client";
import { useEffect, useState } from 'react';

export default function ContractTable() {
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    fetch('/api/contracts').then(res => res.json()).then(setContracts);
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-minas-chart/20">
      <table className="w-full text-left border-collapse">
        <thead className="bg-minas-dark text-minas-verde text-sm uppercase">
          <tr>
            <th className="p-4 font-bold">Nome do Contrato</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold">Vencimento</th>
            <th className="p-4 font-bold text-center">Resumo IA</th>
          </tr>
        </thead>
        <tbody className="text-gray-300 divide-y divide-white/5">
          {contracts.length === 0 ? (
            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum contrato encontrado.</td></tr>
          ) : (
            contracts.map((c: any) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{c.name}</td>
                <td className="p-4">
                  <span className="bg-minas-menta/20 text-minas-menta px-2 py-1 rounded-md text-xs font-bold">
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-sm">{c.expiryDate || 'Pendente'}</td>
                <td className="p-4 text-center">
                  <button className="text-minas-verde hover:underline text-sm">Ver Resumo</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}