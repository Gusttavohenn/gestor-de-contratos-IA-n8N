"use client";

import { useState, useEffect } from "react";
import { 
  UploadCloud, FileText, RefreshCw, AlertCircle, CheckCircle2, 
  LayoutDashboard, FileSearch, ChevronDown, ChevronUp, Search, 
  Download, Building2, Calendar, Phone, Trash2, DollarSign, Eye,
  TrendingUp, Clock, ShieldAlert
} from "lucide-react";

interface ContractData {
  id: string;
  name: string | null;
  fileName: string;
  status: string;
  aiSummary: string | null;
  validityDate: string | null;
  cnpj: string | null;
  contact: string | null;
  value: string | null;
  monthlyValue: string | null;
  createdAt: string | Date;
}

//Helpers de Data e Valor

function parseBrazilianDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (parts) return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T00:00:00`);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getContractStatus(validityDate: string | null, aiStatus: string): {
  label: string;
  colorClass: string;
  dotClass: string;
} {
  if (aiStatus !== 'Ativo') {
    return {
      label: 'ANALISANDO...',
      colorClass: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      dotClass: 'bg-yellow-400 animate-pulse',
    };
  }

  const date = parseBrazilianDate(validityDate);
  if (!date) {
    return {
      label: 'VIGENTE',
      colorClass: 'bg-[#C9DF8C]/10 text-[#C9DF8C] border border-[#C9DF8C]/30',
      dotClass: 'bg-[#C9DF8C]',
    };
  }

  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'EXPIRADO',
      colorClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      dotClass: 'bg-red-500',
    };
  }
  if (diffDays <= 60) {
    return {
      label: 'VENCE EM BREVE',
      colorClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      dotClass: 'bg-orange-400 animate-pulse',
    };
  }
  return {
    label: 'VIGENTE',
    colorClass: 'bg-[#C9DF8C]/10 text-[#C9DF8C] border border-[#C9DF8C]/30',
    dotClass: 'bg-[#C9DF8C]',
  };
}

function parseMonetaryValue(str: string | null): number {
  if (!str) return 0;
  const cleaned = str.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(value: number): string {
  if (value === 0) return '---';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Componente de Card do Painel
function StatCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-xl flex flex-col gap-3
      ${accent 
        ? 'bg-[#C9DF8C]/10 border-[#C9DF8C]/30' 
        : 'bg-[#111827] border-gray-800'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{label}</p>
        <div className={`p-2 rounded-lg ${accent ? 'bg-[#C9DF8C]/20' : 'bg-gray-800'}`}>
          <Icon className={`w-4 h-4 ${accent ? 'text-[#C9DF8C]' : 'text-gray-400'}`} />
        </div>
      </div>
      <p className={`text-3xl font-black tracking-tight ${accent ? 'text-[#C9DF8C]' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      {/* Decoração de fundo */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5
        ${accent ? 'bg-[#C9DF8C]' : 'bg-white'}`} />
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'painel' | 'analisar' | 'contratos'>('painel');
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const isPolling = contracts.some(c => c.status !== 'Ativo');

  async function fetchContracts(silent = false) {
    if (!silent) setIsLoadingList(true);
    try {
      const response = await fetch(`/api/contracts?t=${new Date().getTime()}`);
      const data = await response.json();
      if (Array.isArray(data)) setContracts(data);
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  }

  useEffect(() => {
    fetchContracts();
  }, []);

  // Auto refresh
  useEffect(() => {
    const hasAnalyzing = contracts.some(c => c.status !== 'Ativo');
    if (!hasAnalyzing) return;

    const interval = setInterval(() => {
      fetchContracts(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [contracts]);

  // Métricas do Painel
  const activeContracts = contracts.filter(c => c.status === 'Ativo');
  const totalValue = activeContracts.reduce((sum, c) => sum + parseMonetaryValue(c.value), 0);
  const totalMonthly = activeContracts.reduce((sum, c) => sum + parseMonetaryValue(c.monthlyValue), 0);
  const expiringCount = activeContracts.filter(c => {
    const date = parseBrazilianDate(c.validityDate);
    if (!date) return false;
    const diffDays = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    try {
      const res = await fetch(`/api/contracts/delete?id=${contractToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setContracts(contracts.filter(c => c.id !== contractToDelete));
        setExpandedId(null);
      } else {
        alert("Erro ao excluir do servidor.");
      }
    } catch (error) {
      console.error("Erro na infra ao deletar:", error);
    } finally {
      setContractToDelete(null);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = (
      c.name?.toLowerCase().includes(searchLower) ||
      c.cnpj?.includes(searchTerm) ||
      c.fileName?.toLowerCase().includes(searchLower)
    );
    if (!matchSearch) return false;
    if (statusFilter === 'TODOS') return true;
    const contractStatus = getContractStatus(c.validityDate, c.status);
    return contractStatus.label === statusFilter;
  });

  const statusCounts = {
    TODOS: contracts.length,
    VIGENTE: contracts.filter(c => getContractStatus(c.validityDate, c.status).label === 'VIGENTE').length,
    'VENCE EM BREVE': contracts.filter(c => getContractStatus(c.validityDate, c.status).label === 'VENCE EM BREVE').length,
    EXPIRADO: contracts.filter(c => getContractStatus(c.validityDate, c.status).label === 'EXPIRADO').length,
    'ANALISANDO...': contracts.filter(c => getContractStatus(c.validityDate, c.status).label === 'ANALISANDO...').length,
  };

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Falha no upload");
      setUploadStatus({ type: 'success', message: `Contrato enviado! A IA está extraindo os dados.` });
      fetchContracts();
      setTimeout(() => setActiveTab('contratos'), 1500);
    } catch {
      setUploadStatus({ type: 'error', message: "Erro ao enviar o arquivo." });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  const DevSignature = () => (
    <div className="mt-12 flex flex-col items-center gap-1 animate-pulse">
      <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-medium">Developed by</p>
      <p className="text-xs font-bold text-[#C9DF8C]/60 hover:text-[#C9DF8C] transition-colors cursor-default">
        GUSTAVO OLIVEIRA
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0A0F1A] text-gray-100 font-sans selection:bg-[#C9DF8C] selection:text-[#0A0F1A]">
      <header className="bg-[#111827] border-b border-[#C9DF8C]/20 px-8 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-[#C9DF8C] p-2 rounded-lg">
            <Building2 className="w-5 h-5 text-[#0A0F1A]" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Minas Port <span className="text-[#C9DF8C]">Docs</span>
          </h1>
        </div>
        
        <nav className="flex items-center gap-2 bg-[#0A0F1A] p-1 rounded-lg border border-gray-800">
          <button onClick={() => setActiveTab('painel')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'painel' ? 'bg-[#111827] text-[#C9DF8C] shadow border border-[#C9DF8C]/20' : 'text-gray-400 hover:text-gray-200'}`}>
            <LayoutDashboard className="w-4 h-4" /> Painel
          </button>
          <button onClick={() => setActiveTab('analisar')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'analisar' ? 'bg-[#C9DF8C] text-[#0A0F1A] shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
            <UploadCloud className="w-4 h-4" /> Analisar Contrato
          </button>
          <button onClick={() => { setActiveTab('contratos'); fetchContracts(); }} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'contratos' ? 'bg-[#111827] text-[#C9DF8C] shadow border border-[#C9DF8C]/20' : 'text-gray-400 hover:text-gray-200'}`}>
            <FileSearch className="w-4 h-4" /> Base de Contratos
          </button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto mt-10 p-6">

        {/* ===================== PAINEL ===================== */}
        {activeTab === 'painel' && (
          <div className="flex flex-col">
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={FileText}
                label="Total de Contratos"
                value={String(contracts.length)}
                sub={`${activeContracts.length} processados`}
              />
              <StatCard
                icon={TrendingUp}
                label="Valor sob Gestão"
                value={formatCurrency(totalValue)}
                sub="Soma dos valores totais"
                accent
              />
              <StatCard
                icon={DollarSign}
                label="Receita Mensal"
                value={formatCurrency(totalMonthly)}
                sub="Soma das mensalidades"
              />
              <StatCard
                icon={ShieldAlert}
                label="Vencem em 30 dias"
                value={String(expiringCount)}
                sub={expiringCount > 0 ? "Atenção necessária" : "Tudo em ordem"}
              />
            </div>

            {/* Primeira tela */}
            <div className="w-full bg-[#111827] rounded-2xl border border-gray-800 p-16 text-center shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-[#C9DF8C]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#C9DF8C]/20">
                <Building2 className="w-8 h-8 text-[#C9DF8C]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Gestão Inteligente de Contratos Minas Port</h2>
              <p className="text-gray-400 mb-8 max-w-lg text-lg">
                Centralize, pesquise e analise documentos com a precisão da Inteligência Artificial em segundos.
              </p>
              <button 
                onClick={() => setActiveTab('analisar')} 
                className="bg-[#C9DF8C] hover:bg-[#b8cc7c] text-[#0A0F1A] px-8 py-4 rounded-xl font-bold transition-transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#C9DF8C]/20"
              >
                <UploadCloud className="w-5 h-5" /> Iniciar Nova Análise
              </button>
            </div>
            <DevSignature />
          </div>
        )}

        {/* ===================== ANALISAR ===================== */}
        {activeTab === 'analisar' && (
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-10 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white">Processamento Automático</h2>
              <p className="text-gray-400 mt-2">Nossa IA extrairá CNPJ, vigência, contatos e gera um resumo executivo.</p>
            </div>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl p-16 bg-[#0A0F1A] hover:border-[#C9DF8C]/50 hover:bg-[#C9DF8C]/5 transition-all group">
              <UploadCloud className="w-16 h-16 text-gray-600 group-hover:text-[#C9DF8C] mb-6 transition-colors" />
              <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                <span className="bg-[#C9DF8C] hover:bg-[#b8cc7c] text-[#0A0F1A] px-8 py-3 rounded-lg font-bold transition-colors inline-block text-center shadow-lg">
                  {isUploading ? "Processando no servidor..." : "Selecionar Documento PDF"}
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-4">Somente arquivos PDF</p>
            </div>

            {uploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium ${uploadStatus.type === 'success' ? 'bg-[#C9DF8C]/10 text-[#C9DF8C] border border-[#C9DF8C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                {uploadStatus.message}
              </div>
            )}
          </div>
        )}

        {/* ===================== CONTRATOS ===================== */}
        {activeTab === 'contratos' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por empresa, arquivo ou CNPJ..." 
                  className="w-full bg-[#111827] border border-gray-800 text-white placeholder-gray-500 rounded-xl py-4 pl-12 pr-4 focus:border-[#C9DF8C] outline-none transition-all shadow-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => fetchContracts()} className="px-6 py-4 bg-[#111827] border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2 text-gray-300">
                <RefreshCw className={`w-5 h-5 ${isLoadingList ? 'animate-spin text-[#C9DF8C]' : ''}`} />
                Atualizar
              </button>
              {isPolling && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Atualizando automaticamente...
                </div>
              )}
            </div>

            {/* Filtros de status */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'TODOS',          label: 'Todos',           cls: 'border-gray-700 text-gray-400 hover:border-gray-500',                          active: 'bg-gray-700 text-white border-gray-600' },
                { key: 'VIGENTE',        label: 'Vigente',         cls: 'border-[#C9DF8C]/20 text-[#C9DF8C]/60 hover:border-[#C9DF8C]/50',              active: 'bg-[#C9DF8C]/15 text-[#C9DF8C] border-[#C9DF8C]/40' },
                { key: 'VENCE EM BREVE', label: 'Vence em Breve',  cls: 'border-orange-500/20 text-orange-400/60 hover:border-orange-500/40',           active: 'bg-orange-500/15 text-orange-400 border-orange-500/40' },
                { key: 'EXPIRADO',       label: 'Expirado',        cls: 'border-red-500/20 text-red-400/60 hover:border-red-500/40',                    active: 'bg-red-500/15 text-red-400 border-red-500/40' },
                { key: 'ANALISANDO...', label: 'Analisando',       cls: 'border-yellow-500/20 text-yellow-400/60 hover:border-yellow-500/40',           active: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' },
              ] as const).map(({ key, label, cls, active }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all
                    ${statusFilter === key ? active : `bg-[#111827] ${cls}`}`}
                >
                  {key !== 'TODOS' && (
                    <span className={`w-2 h-2 rounded-full ${
                      key === 'VIGENTE' ? 'bg-[#C9DF8C]' :
                      key === 'VENCE EM BREVE' ? 'bg-orange-400' :
                      key === 'EXPIRADO' ? 'bg-red-500' : 'bg-yellow-400'
                    }`} />
                  )}
                  {label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black
                    ${statusFilter === key ? 'bg-white/20' : 'bg-gray-800 text-gray-500'}`}>
                    {statusCounts[key]}
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-[#111827] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="divide-y divide-gray-800/50">
                {filteredContracts.length === 0 && !isLoadingList ? (
                  <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                    <FileSearch className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum contrato encontrado para esta pesquisa.</p>
                  </div>
                ) : (
                  filteredContracts.map((contract) => {
                    const contractStatus = getContractStatus(contract.validityDate, contract.status);
                    return (
                      <div key={contract.id} className="group flex flex-col hover:bg-[#0A0F1A]/50 transition-colors">
                        <div 
                          className="flex items-center justify-between p-6 cursor-pointer"
                          onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-xl border ${
                              contractStatus.label === 'VIGENTE' 
                                ? 'bg-[#C9DF8C]/10 border-[#C9DF8C]/20 text-[#C9DF8C]' 
                                : contractStatus.label === 'EXPIRADO'
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                  : contractStatus.label === 'VENCE EM BREVE'
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}>
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-white font-bold text-lg">{contract.name || contract.fileName}</h3>
                              <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> PDF</span>
                                {contract.cnpj && (
                                  <>
                                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                    <span className="font-mono text-[#C9DF8C]/80">{contract.cnpj}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="hidden md:block text-right">
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Validade</p>
                              <p className={`text-sm font-medium ${contract.validityDate ? 'text-gray-300' : 'text-gray-600'}`}>
                                {contract.validityDate || "---"}
                              </p>
                            </div>

                            {/* status dinâmico */}
                            <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${contractStatus.colorClass}`}>
                              <span className={`w-2 h-2 rounded-full ${contractStatus.dotClass}`} />
                              {contractStatus.label}
                            </span>

                            {expandedId === contract.id 
                              ? <ChevronUp className="text-[#C9DF8C] w-5 h-5" /> 
                              : <ChevronDown className="text-gray-600 w-5 h-5" />
                            }
                          </div>
                        </div>

                        {expandedId === contract.id && (
                          <div className="px-6 pb-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Calendar className="w-4 h-4 text-[#C9DF8C]" /> Vigência
                                </p>
                                <p className="font-bold text-gray-200">{contract.validityDate || "Não identificado"}</p>
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Building2 className="w-4 h-4 text-[#C9DF8C]" /> CNPJ
                                </p>
                                <p className="font-bold text-gray-200 font-mono">{contract.cnpj || "Não identificado"}</p>
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner overflow-hidden">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Phone className="w-4 h-4 text-[#C9DF8C]" /> Contato
                                </p>
                                <p className="font-bold text-gray-200 break-all">{contract.contact || "Não disponível"}</p>
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <DollarSign className="w-4 h-4 text-[#C9DF8C]" /> Valor Total
                                </p>
                                <p className="font-bold text-gray-200">{contract.value || "Em análise..."}</p>
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <DollarSign className="w-4 h-4 text-[#C9DF8C]" /> Mensalidade
                                </p>
                                <p className="font-bold text-gray-200">{contract.monthlyValue || "Não aplicável"}</p>
                              </div>
                            </div>

                            <div className="bg-[#0A0F1A] border border-[#C9DF8C]/20 p-8 rounded-2xl relative shadow-inner">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-black text-[#C9DF8C] uppercase tracking-[0.15em] flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" /> Resumo feito pela IA
                                </h4>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); window.open(`/uploads/${encodeURIComponent(contract.fileName)}`, '_blank'); }}
                                    className="flex items-center gap-2 bg-[#C9DF8C]/10 hover:bg-[#C9DF8C] text-[#C9DF8C] hover:text-[#0A0F1A] px-4 py-2 rounded-lg text-xs font-bold transition-all border border-[#C9DF8C]/30 hover:border-[#C9DF8C]"
                                    title="Abrir PDF no Navegador"
                                  >
                                    <Eye className="w-4 h-4" /> VISUALIZAR
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); window.open(`/api/download?id=${contract.id}`, '_blank'); }}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-gray-700"
                                    title="Baixar Arquivo Original"
                                  >
                                    <Download className="w-4 h-4" /> BAIXAR
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setContractToDelete(contract.id); }}
                                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 hover:border-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" /> EXCLUIR
                                  </button>
                                </div>
                              </div>
                              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {contract.aiSummary 
                                  ? contract.aiSummary 
                                  : <span className="text-gray-600 italic">O resumo inteligente ainda não foi processado.</span>
                                }
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de exclusão */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-red-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-4 text-red-500">
              <div className="bg-red-500/10 p-3 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Excluir Contrato?</h3>
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed text-lg">
              Tem certeza que deseja apagar este contrato? O arquivo PDF será removido 
              <strong className="text-red-400 font-normal"> definitivamente</strong> do servidor. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setContractToDelete(null)}
                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                <Trash2 className="w-5 h-5" /> Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}