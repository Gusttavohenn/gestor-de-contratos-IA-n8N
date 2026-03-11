"use client";

import { useState, useEffect } from "react";
import {
  UploadCloud, FileText, RefreshCw, AlertCircle, CheckCircle2,
  LayoutDashboard, FileSearch, ChevronDown, ChevronUp, Search,
  Download, Building2, Calendar, Phone, Trash2, DollarSign, Eye,
  TrendingUp, ShieldAlert, Tag, User, RotateCcw, Plus, X, Settings,
  Pencil, Check, ArrowUpDown
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
  company: string | null;
  category: string | null;
  renewal: string | null;
  manager: string | null;
  createdAt: string | Date;
}

const COMPANIES = [
  "MINAS TRADING COMPANY",
  "CARBOAMERICA JM HOLDINGS",
  "SULMINAS OPERAÇÕES",
  "CONSORCIO SUL MINAS",
  "MINAS PORT SPE LTDA",
  "GM HOLDINGS",
  "MM PARTICIPAÇÕES",
] as const;

const RENEWAL_OPTIONS = [
  "Automática",
  "Manual",
  "Não renova",
  "Sob consulta",
] as const;

//Helpers de Data e Valor

function parseBrazilianDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (parts) return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T00:00:00`);
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getContractStatus(validityDate: string | null, aiStatus: string, renewal?: string | null): {
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
    if (renewal === 'Automática') {
      return {
        label: 'RENOVÁVEL',
        colorClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        dotClass: 'bg-blue-400',
      };
    }
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
  const [activeTab, setActiveTab] = useState<'painel' | 'analisar' | 'contratos' | 'cadastro'>('painel');
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [companyFilter, setCompanyFilter] = useState<string>('TODAS');
  const [sortField, setSortField] = useState<'name' | 'company' | 'value' | 'validityDate' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContractData>>({});
  const ITEMS_PER_PAGE = 10;
  const isPolling = contracts.some(c => c.status !== 'Ativo');

  // Novos campos do formulário de upload
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedManager, setSelectedManager] = useState("");

  // Categorias dinâmicas
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Gestores dinâmicos
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);
  const [newManagerName, setNewManagerName] = useState("");

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

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) {
      console.error("Erro ao buscar categorias:", e);
    }
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        setNewCategoryName("");
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar categoria");
      }
    } catch (e) {
      console.error("Erro ao criar categoria:", e);
    }
  }

  async function deleteCategory(id: string) {
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (e) {
      console.error("Erro ao deletar categoria:", e);
    }
  }

  async function fetchManagers() {
    try {
      const res = await fetch('/api/managers');
      const data = await res.json();
      if (Array.isArray(data)) setManagers(data);
    } catch (e) {
      console.error("Erro ao buscar gestores:", e);
    }
  }

  async function addManager() {
    if (!newManagerName.trim()) return;
    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newManagerName.trim() }),
      });
      if (res.ok) {
        setNewManagerName("");
        fetchManagers();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar gestor");
      }
    } catch (e) {
      console.error("Erro ao criar gestor:", e);
    }
  }

  async function deleteManager(id: string) {
    try {
      await fetch(`/api/managers?id=${id}`, { method: 'DELETE' });
      fetchManagers();
    } catch (e) {
      console.error("Erro ao deletar gestor:", e);
    }
  }

  function startEditing(contract: ContractData) {
    setEditingId(contract.id);
    setEditForm({
      name: contract.name,
      company: contract.company,
      category: contract.category,
      renewal: contract.renewal,
      manager: contract.manager,
      validityDate: contract.validityDate,
      cnpj: contract.cnpj,
      contact: contract.contact,
      value: contract.value,
      monthlyValue: contract.monthlyValue,
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const res = await fetch('/api/contracts/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchContracts(true);
      } else {
        alert("Erro ao salvar edição.");
      }
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  }

  function toggleSort(field: 'name' | 'company' | 'value' | 'validityDate') {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }

  useEffect(() => {
    fetchContracts();
    fetchCategories();
    fetchManagers();
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

  const filteredContracts = contracts
    .filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = (
        c.name?.toLowerCase().includes(searchLower) ||
        c.cnpj?.includes(searchTerm) ||
        c.fileName?.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.manager?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower)
      );
      if (!matchSearch) return false;
      if (companyFilter !== 'TODAS' && c.company !== companyFilter) return false;
      if (statusFilter === 'TODOS') return true;
      const contractStatus = getContractStatus(c.validityDate, c.status, c.renewal);
      return contractStatus.label === statusFilter;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'value') {
        return (parseMonetaryValue(a.value) - parseMonetaryValue(b.value)) * dir;
      }
      if (sortField === 'validityDate') {
        const da = parseBrazilianDate(a.validityDate)?.getTime() || 0;
        const db = parseBrazilianDate(b.validityDate)?.getTime() || 0;
        return (da - db) * dir;
      }
      const va = (a[sortField] || '').toLowerCase();
      const vb = (b[sortField] || '').toLowerCase();
      return va.localeCompare(vb) * dir;
    });

  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statusCounts = {
    TODOS: contracts.length,
    VIGENTE: contracts.filter(c => getContractStatus(c.validityDate, c.status, c.renewal).label === 'VIGENTE').length,
    'VENCE EM BREVE': contracts.filter(c => getContractStatus(c.validityDate, c.status, c.renewal).label === 'VENCE EM BREVE').length,
    'RENOVÁVEL': contracts.filter(c => getContractStatus(c.validityDate, c.status, c.renewal).label === 'RENOVÁVEL').length,
    EXPIRADO: contracts.filter(c => getContractStatus(c.validityDate, c.status, c.renewal).label === 'EXPIRADO').length,
    'ANALISANDO...': contracts.filter(c => getContractStatus(c.validityDate, c.status, c.renewal).label === 'ANALISANDO...').length,
  };

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!selectedCompany) {
      setUploadStatus({ type: 'error', message: "Selecione a empresa do grupo antes de enviar." });
      event.target.value = "";
      return;
    }
    setIsUploading(true);
    setUploadStatus(null);
    let successCount = 0;
    let errorCount = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedCompany) formData.append("company", selectedCompany);
      if (selectedManager) formData.append("manager", selectedManager);
      try {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Falha no upload");
        successCount++;
      } catch {
        errorCount++;
      }
    }
    if (errorCount === 0) {
      setUploadStatus({ type: 'success', message: `${successCount} contrato${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''}! A IA está extraindo os dados.` });
    } else {
      setUploadStatus({ type: 'error', message: `${successCount} enviado${successCount > 1 ? 's' : ''}, ${errorCount} com erro.` });
    }
    setSelectedCompany("");
    setSelectedManager("");
    fetchContracts();
    setIsUploading(false);
    if (event.target) event.target.value = "";
    if (successCount > 0) setTimeout(() => setActiveTab('contratos'), 1500);
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
          <button onClick={() => setActiveTab('cadastro')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'cadastro' ? 'bg-[#111827] text-[#C9DF8C] shadow border border-[#C9DF8C]/20' : 'text-gray-400 hover:text-gray-200'}`}>
            <Settings className="w-4 h-4" /> Cadastros
          </button>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto mt-10 p-6">

        {/* ===================== PAINEL ===================== */}
        {activeTab === 'painel' && (
          <div className="flex flex-col">
            {/* Hero */}
            <div className="w-full bg-[#111827] rounded-2xl border border-gray-800 p-16 text-center shadow-2xl flex flex-col items-center justify-center min-h-[300px] mb-8">
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

            {/* Distribuição por Categoria */}
            {(() => {
              const categoryBreakdown: Record<string, { count: number; total: number; monthly: number }> = {};
              activeContracts.forEach(c => {
                const cat = c.category || "Sem categoria";
                if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, total: 0, monthly: 0 };
                categoryBreakdown[cat].count++;
                categoryBreakdown[cat].total += parseMonetaryValue(c.value);
                categoryBreakdown[cat].monthly += parseMonetaryValue(c.monthlyValue);
              });
              const entries = Object.entries(categoryBreakdown).sort((a, b) => b[1].total - a[1].total);
              const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1);

              return entries.length > 0 ? (
                <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-2xl mb-8">
                  <h3 className="text-sm font-black text-[#C9DF8C] uppercase tracking-[0.15em] flex items-center gap-2 mb-6">
                    <Tag className="w-4 h-4" /> Distribuição por Categoria
                  </h3>
                  <div className="space-y-4">
                    {entries.map(([cat, data]) => {
                      const pct = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-white">{cat}</span>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{data.count} contrato{data.count !== 1 ? 's' : ''}</span>
                              <span className="font-bold text-[#C9DF8C]">{formatCurrency(data.total)}</span>
                              {data.monthly > 0 && (
                                <span className="text-gray-500">{formatCurrency(data.monthly)}/mês</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5">
                            <div
                              className="bg-[#C9DF8C] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Distribuição por Empresa */}
            {(() => {
              const companyBreakdown: Record<string, { count: number; total: number; monthly: number }> = {};
              activeContracts.forEach(c => {
                const comp = c.company || "Sem empresa";
                if (!companyBreakdown[comp]) companyBreakdown[comp] = { count: 0, total: 0, monthly: 0 };
                companyBreakdown[comp].count++;
                companyBreakdown[comp].total += parseMonetaryValue(c.value);
                companyBreakdown[comp].monthly += parseMonetaryValue(c.monthlyValue);
              });
              const entries = Object.entries(companyBreakdown).sort((a, b) => b[1].total - a[1].total);
              const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1);

              return entries.length > 0 ? (
                <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-2xl mb-8">
                  <h3 className="text-sm font-black text-[#C9DF8C] uppercase tracking-[0.15em] flex items-center gap-2 mb-6">
                    <Building2 className="w-4 h-4" /> Distribuição por Empresa
                  </h3>
                  <div className="space-y-4">
                    {entries.map(([comp, data]) => {
                      const pct = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
                      return (
                        <div key={comp}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-white">{comp}</span>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>{data.count} contrato{data.count !== 1 ? 's' : ''}</span>
                              <span className="font-bold text-[#C9DF8C]">{formatCurrency(data.total)}</span>
                              {data.monthly > 0 && (
                                <span className="text-gray-500">{formatCurrency(data.monthly)}/mês</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5">
                            <div
                              className="bg-[#C9DF8C] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            <DevSignature />
          </div>
        )}

        {/* ===================== ANALISAR ===================== */}
        {activeTab === 'analisar' && (
          <div className="space-y-6">
            <div className="bg-[#111827] rounded-2xl border border-gray-800 p-10 shadow-2xl">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-white">Processamento Automático</h2>
                <p className="text-gray-400 mt-2">Preencha os campos abaixo e envie o PDF. A IA extrairá CNPJ, vigência, categoria, renovação e resumo.</p>
              </div>

              {/* Formulário de classificação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                    <Building2 className="w-4 h-4 inline mr-1.5 text-[#C9DF8C]" />
                    Empresa do Grupo *
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full bg-[#0A0F1A] border border-gray-700 text-white rounded-xl py-3 px-4 focus:border-[#C9DF8C] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione a empresa...</option>
                    {COMPANIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                    <User className="w-4 h-4 inline mr-1.5 text-[#C9DF8C]" />
                    Gestor do Contrato
                  </label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="w-full bg-[#0A0F1A] border border-gray-700 text-white rounded-xl py-3 px-4 focus:border-[#C9DF8C] outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o gestor...</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload area */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl p-16 bg-[#0A0F1A] hover:border-[#C9DF8C]/50 hover:bg-[#C9DF8C]/5 transition-all group">
                <UploadCloud className="w-16 h-16 text-gray-600 group-hover:text-[#C9DF8C] mb-6 transition-colors" />
                <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept=".pdf" multiple onChange={handleFileUpload} disabled={isUploading} className="hidden" />
                  <span className="bg-[#C9DF8C] hover:bg-[#b8cc7c] text-[#0A0F1A] px-8 py-3 rounded-lg font-bold transition-colors inline-block text-center shadow-lg">
                    {isUploading ? "Processando no servidor..." : "Selecionar Documentos PDF"}
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-4">Somente arquivos PDF — selecione um ou vários</p>
              </div>

              {uploadStatus && (
                <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium ${uploadStatus.type === 'success' ? 'bg-[#C9DF8C]/10 text-[#C9DF8C] border border-[#C9DF8C]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                  {uploadStatus.message}
                </div>
              )}
            </div>

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
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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

            {/* Filtro por empresa + ordenação */}
            <div className="flex gap-4">
              <div className="flex-1">
                <select
                  value={companyFilter}
                  onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#111827] border border-gray-800 text-white rounded-xl py-3 px-4 focus:border-[#C9DF8C] outline-none transition-all shadow-lg appearance-none text-sm"
                >
                  <option value="TODAS">Todas as empresas</option>
                  {COMPANIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                {([
                  { field: 'name' as const, label: 'Nome' },
                  { field: 'company' as const, label: 'Empresa' },
                  { field: 'value' as const, label: 'Valor' },
                  { field: 'validityDate' as const, label: 'Vigência' },
                ] as const).map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      sortField === field
                        ? 'bg-[#C9DF8C]/15 text-[#C9DF8C] border-[#C9DF8C]/30'
                        : 'bg-[#111827] border-gray-800 text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      <span className="text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros de status */}
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'TODOS',          label: 'Todos',           cls: 'border-gray-700 text-gray-400 hover:border-gray-500',                          active: 'bg-gray-700 text-white border-gray-600' },
                { key: 'VIGENTE',        label: 'Vigente',         cls: 'border-[#C9DF8C]/20 text-[#C9DF8C]/60 hover:border-[#C9DF8C]/50',              active: 'bg-[#C9DF8C]/15 text-[#C9DF8C] border-[#C9DF8C]/40' },
                { key: 'VENCE EM BREVE', label: 'Vence em Breve',  cls: 'border-orange-500/20 text-orange-400/60 hover:border-orange-500/40',           active: 'bg-orange-500/15 text-orange-400 border-orange-500/40' },
                { key: 'RENOVÁVEL',      label: 'Renovável',       cls: 'border-blue-500/20 text-blue-400/60 hover:border-blue-500/40',                  active: 'bg-blue-500/15 text-blue-400 border-blue-500/40' },
                { key: 'EXPIRADO',       label: 'Expirado',        cls: 'border-red-500/20 text-red-400/60 hover:border-red-500/40',                    active: 'bg-red-500/15 text-red-400 border-red-500/40' },
                { key: 'ANALISANDO...', label: 'Analisando',       cls: 'border-yellow-500/20 text-yellow-400/60 hover:border-yellow-500/40',           active: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40' },
              ] as const).map(({ key, label, cls, active }) => (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all
                    ${statusFilter === key ? active : `bg-[#111827] ${cls}`}`}
                >
                  {key !== 'TODOS' && (
                    <span className={`w-2 h-2 rounded-full ${
                      key === 'VIGENTE' ? 'bg-[#C9DF8C]' :
                      key === 'VENCE EM BREVE' ? 'bg-orange-400' :
                      key === 'RENOVÁVEL' ? 'bg-blue-400' :
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
                {isLoadingList ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6 animate-pulse">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gray-800 rounded-xl" />
                        <div className="space-y-2">
                          <div className="h-4 w-48 bg-gray-800 rounded" />
                          <div className="h-3 w-32 bg-gray-800/60 rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="h-4 w-24 bg-gray-800 rounded hidden md:block" />
                        <div className="h-6 w-28 bg-gray-800 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : filteredContracts.length === 0 ? (
                  <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                    <FileSearch className="w-12 h-12 mb-4 opacity-20" />
                    <p>Nenhum contrato encontrado para esta pesquisa.</p>
                  </div>
                ) : (
                  paginatedContracts.map((contract) => {
                    const contractStatus = getContractStatus(contract.validityDate, contract.status, contract.renewal);
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
                                : contractStatus.label === 'RENOVÁVEL'
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
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
                            {/* Botão editar */}
                            <div className="flex justify-end mb-3">
                              {editingId === contract.id ? (
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white border border-gray-700 hover:bg-gray-800 transition-all">
                                    <X className="w-3 h-3" /> Cancelar
                                  </button>
                                  <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C9DF8C] text-[#0A0F1A] hover:bg-[#b8cc7c] transition-all">
                                    <Check className="w-3 h-3" /> Salvar
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => startEditing(contract)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-[#C9DF8C] border border-gray-700 hover:border-[#C9DF8C]/30 transition-all">
                                  <Pencil className="w-3 h-3" /> Editar
                                </button>
                              )}
                            </div>
                            {/* Linha 1: Empresa, Categoria, Renovação, Gestor */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Building2 className="w-4 h-4 text-[#C9DF8C]" /> Empresa
                                </p>
                                {editingId === contract.id ? (
                                  <select value={editForm.company || ''} onChange={e => setEditForm({...editForm, company: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]">
                                    <option value="">Selecione...</option>
                                    {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                ) : (
                                  <p className="font-bold text-gray-200 text-sm">{contract.company || "Não informada"}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Tag className="w-4 h-4 text-[#C9DF8C]" /> Categoria
                                </p>
                                {editingId === contract.id ? (
                                  <select value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]">
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                ) : (
                                  <p className="font-bold text-gray-200 text-sm">{contract.category || "Aguardando IA..."}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <RotateCcw className="w-4 h-4 text-[#C9DF8C]" /> Renovação
                                </p>
                                {editingId === contract.id ? (
                                  <select value={editForm.renewal || ''} onChange={e => setEditForm({...editForm, renewal: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]">
                                    <option value="">Selecione...</option>
                                    {RENEWAL_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                ) : (
                                  <p className="font-bold text-gray-200 text-sm">{contract.renewal || "Aguardando IA..."}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <User className="w-4 h-4 text-[#C9DF8C]" /> Gestor
                                </p>
                                {editingId === contract.id ? (
                                  <select value={editForm.manager || ''} onChange={e => setEditForm({...editForm, manager: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]">
                                    <option value="">Selecione...</option>
                                    {managers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                  </select>
                                ) : (
                                  <p className="font-bold text-gray-200 text-sm">{contract.manager || "Não informado"}</p>
                                )}
                              </div>
                            </div>
                            {/* Linha 2: Vigência, CNPJ, Contato, Valores */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Calendar className="w-4 h-4 text-[#C9DF8C]" /> Vigência
                                </p>
                                {editingId === contract.id ? (
                                  <input type="text" value={editForm.validityDate || ''} onChange={e => setEditForm({...editForm, validityDate: e.target.value})} placeholder="dd/mm/aaaa" className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]" />
                                ) : (
                                  <p className="font-bold text-gray-200">{contract.validityDate || "Não identificado"}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Building2 className="w-4 h-4 text-[#C9DF8C]" /> CNPJ
                                </p>
                                {editingId === contract.id ? (
                                  <input type="text" value={editForm.cnpj || ''} onChange={e => setEditForm({...editForm, cnpj: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]" />
                                ) : (
                                  <p className="font-bold text-gray-200 font-mono">{contract.cnpj || "Não identificado"}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner overflow-hidden">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <Phone className="w-4 h-4 text-[#C9DF8C]" /> Contato
                                </p>
                                {editingId === contract.id ? (
                                  <input type="text" value={editForm.contact || ''} onChange={e => setEditForm({...editForm, contact: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]" />
                                ) : (
                                  <p className="font-bold text-gray-200 break-all">{contract.contact || "Não disponível"}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <DollarSign className="w-4 h-4 text-[#C9DF8C]" /> Valor Total
                                </p>
                                {editingId === contract.id ? (
                                  <input type="text" value={editForm.value || ''} onChange={e => setEditForm({...editForm, value: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]" />
                                ) : (
                                  <p className="font-bold text-gray-200">{contract.value || "Em análise..."}</p>
                                )}
                              </div>
                              <div className="bg-[#0A0F1A] p-4 rounded-xl border border-gray-800/60 shadow-inner">
                                <p className="text-xs text-gray-500 mb-2 flex items-center gap-2 uppercase font-bold tracking-wider">
                                  <DollarSign className="w-4 h-4 text-[#C9DF8C]" /> Mensalidade
                                </p>
                                {editingId === contract.id ? (
                                  <input type="text" value={editForm.monthlyValue || ''} onChange={e => setEditForm({...editForm, monthlyValue: e.target.value})} className="w-full bg-[#111827] border border-gray-700 text-white rounded-lg py-1.5 px-2 text-sm outline-none focus:border-[#C9DF8C]" />
                                ) : (
                                  <p className="font-bold text-gray-200">{contract.monthlyValue || "Não aplicável"}</p>
                                )}
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

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredContracts.length)} de {filteredContracts.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-800 bg-[#111827] text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                        currentPage === page
                          ? 'bg-[#C9DF8C] text-[#0A0F1A]'
                          : 'bg-[#111827] border border-gray-800 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-800 bg-[#111827] text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== CADASTRO ===================== */}
        {activeTab === 'cadastro' && (
          <div className="space-y-6">
            <div className="bg-[#111827] rounded-2xl border border-gray-800 p-10 shadow-2xl">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-white">Cadastros do Sistema</h2>
                <p className="text-gray-400 mt-2">Gerencie as categorias e gestores disponíveis para classificação de contratos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categorias */}
                <div className="bg-[#0A0F1A] rounded-2xl border border-gray-800/60 p-6">
                  <h3 className="text-sm font-black text-[#C9DF8C] uppercase tracking-[0.15em] flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4" /> Categorias
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Categorias que a IA classificará nos contratos.</p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      placeholder="Nova categoria..."
                      className="flex-1 bg-[#111827] border border-gray-700 text-white placeholder-gray-600 rounded-lg py-2 px-4 focus:border-[#C9DF8C] outline-none text-sm"
                    />
                    <button
                      onClick={addCategory}
                      className="bg-[#C9DF8C] hover:bg-[#b8cc7c] text-[#0A0F1A] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <span key={cat.id} className="flex items-center gap-2 bg-[#111827] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium">
                        {cat.name}
                        <button onClick={() => deleteCategory(cat.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-gray-600 text-xs italic">Nenhuma categoria cadastrada.</p>
                    )}
                  </div>
                </div>

                {/* Gestores */}
                <div className="bg-[#0A0F1A] rounded-2xl border border-gray-800/60 p-6">
                  <h3 className="text-sm font-black text-[#C9DF8C] uppercase tracking-[0.15em] flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" /> Gestores
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Gestores disponíveis para atribuir aos contratos.</p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newManagerName}
                      onChange={(e) => setNewManagerName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addManager()}
                      placeholder="Novo gestor..."
                      className="flex-1 bg-[#111827] border border-gray-700 text-white placeholder-gray-600 rounded-lg py-2 px-4 focus:border-[#C9DF8C] outline-none text-sm"
                    />
                    <button
                      onClick={addManager}
                      className="bg-[#C9DF8C] hover:bg-[#b8cc7c] text-[#0A0F1A] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {managers.map(m => (
                      <span key={m.id} className="flex items-center gap-2 bg-[#111827] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium">
                        {m.name}
                        <button onClick={() => deleteManager(m.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {managers.length === 0 && (
                      <p className="text-gray-600 text-xs italic">Nenhum gestor cadastrado.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DevSignature />
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