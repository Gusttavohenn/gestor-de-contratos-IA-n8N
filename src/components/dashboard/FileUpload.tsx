"use client";

import { useState, useRef } from 'react';
import { UploadCloud, Loader2, FileCheck, AlertCircle } from 'lucide-react';

export default function FileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Por favor, selecione apenas arquivos PDF.");
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('success');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-minas-verde/30 rounded-2xl bg-minas-chart/20 hover:bg-minas-chart/40 transition-all group">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {isUploading ? (
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-minas-verde animate-spin mx-auto" />
          <p className="text-minas-verde font-medium animate-pulse">
            IA da Minas Port analisando contrato...
          </p>
          <p className="text-gray-500 text-xs">Isso pode levar alguns segundos</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 bg-minas-verde/10 p-4 rounded-full inline-block group-hover:scale-110 transition-transform">
            {uploadStatus === 'success' ? (
              <FileCheck className="w-10 h-10 text-minas-menta" />
            ) : uploadStatus === 'error' ? (
              <AlertCircle className="w-10 h-10 text-red-400" />
            ) : (
              <UploadCloud className="w-10 h-10 text-minas-verde" />
            )}
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">
            {uploadStatus === 'success' ? "Enviado com Sucesso!" : "Selecione um arquivo PDF"}
          </h3>
          
          <p className="text-gray-400 mb-6 text-sm max-w-[250px] mx-auto">
            {uploadStatus === 'success' 
              ? "O n8n já recebeu seu documento e a IA está processando o resumo." 
              : "Arraste e solte o contrato aqui para análise imediata ou clique abaixo."}
          </p>

          <button 
            onClick={handleButtonClick}
            className={`font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2 mx-auto
              ${uploadStatus === 'success' 
                ? 'bg-minas-menta text-white' 
                : 'bg-minas-verde hover:bg-minas-menta text-minas-dark shadow-minas-verde/10'}
            `}
          >
            {uploadStatus === 'success' ? "Analisar Outro" : "Selecionar Arquivo"}
          </button>
          
          {uploadStatus === 'error' && (
            <p className="text-red-400 text-xs mt-4">Falha ao conectar com o servidor. Verifique o console.</p>
          )}
        </div>
      )}
    </div>
  );
}