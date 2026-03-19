import { useState } from 'react';
import MetricCards from './MetricCards';
import IssueTree from './IssueTree';
import Hypotheses from './Hypotheses';
import Recommendations from './Recommendations';
import ChatInterface from './ChatInterface';
import ExportButton from './ExportButton';

const TABS = [
    { id: 'issueTree', label: 'Issue Tree' },
    { id: 'hypotheses', label: 'Hypotheses' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'chat', label: 'Data Consultant' },
];

function SkeletonCard() {
    return (
        <div className="border border-gray-200 p-6 space-y-4 animate-pulse bg-white">
            <div className="h-4 bg-gray-200 w-1/2" />
            <div className="h-8 bg-gray-200 w-1/3" />
            <div className="h-px bg-gray-200 w-full my-4" />
            <div className="h-3 bg-gray-200 w-2/3" />
        </div>
    );
}

export default function Dashboard({ analysisResult, dataProfile, sector, conn, onNewAnalysis }) {
    const [activeTab, setActiveTab] = useState('issueTree');
    const isLoading = !analysisResult;

    return (
        <div className="min-h-screen bg-white font-sans-body">
            {/* Top Blue Ribbon */}
            <div className="h-1.5 w-full bg-[#2251FF]"></div>

            {/* Header */}
            <header className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-serif-heading font-bold text-gray-900 text-xl tracking-tight">BizLens</span>
                        <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>
                        {sector && (
                            <span className="hidden sm:inline-block text-[12px] font-bold text-gray-500 uppercase tracking-widest">{sector}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <ExportButton analysisResult={analysisResult} sector={sector} />
                        <button
                            onClick={onNewAnalysis}
                            className="px-5 py-2.5 bg-[#F5F5F5] text-gray-900 text-[12px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                        >
                            New Analysis
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-8 py-12 space-y-12">

                {/* Problem Statement and Exec Summary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-1">
                        <h2 className="font-serif-heading text-2xl text-gray-900 font-bold mb-4">Core Problem</h2>
                        {isLoading ? (
                            <div className="h-24 bg-gray-100 animate-pulse"></div>
                        ) : analysisResult?.problemStatement ? (
                            <p className="text-[16px] text-gray-700 leading-relaxed font-light pl-4 border-l-4 border-[#2251FF] py-1">
                                {analysisResult.problemStatement}
                            </p>
                        ) : null}
                    </div>

                    <div className="lg:col-span-2">
                        <h2 className="font-serif-heading text-2xl text-gray-900 font-bold mb-4">Executive Summary</h2>
                        {isLoading ? (
                            <div className="h-32 bg-gray-100 animate-pulse"></div>
                        ) : analysisResult?.executiveSummary ? (
                            <div className="bg-[#F5F5F5] p-6 lg:p-8">
                                <p className="text-[16px] text-gray-700 leading-relaxed">
                                    {analysisResult.executiveSummary}
                                </p>
                            </div>
                        ) : null}
                    </div>

                </div>

                {/* KPIs */}
                <div>
                    <h2 className="font-serif-heading text-2xl text-gray-900 font-bold mb-6">Key Performance Indicators</h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        <MetricCards kpis={analysisResult.kpis} />
                    )}
                </div>

                {/* Deep Dive Tabs */}
                <div className="pt-8 border-t border-gray-200">
                    <h2 className="font-serif-heading text-3xl text-gray-900 font-bold mb-8">Strategic Analysis</h2>

                    {/* Tab nav */}
                    <div className="flex flex-wrap items-center gap-0 border-b border-gray-200 mb-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 text-[13px] font-bold uppercase tracking-widest border-b-4 transition-colors -mb-[2px]
                  ${activeTab === tab.id
                                        ? 'border-[#2251FF] text-[#2251FF]'
                                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-50 border border-gray-100 animate-pulse" />
                            ))}
                            <div className="flex items-center gap-4 py-8">
                                <div className="w-5 h-5 border-2 border-[#2251FF] border-t-transparent rounded-full animate-spin" />
                                <p className="font-serif-heading text-[15px] text-[#2251FF] font-bold italic">Synthesizing professional analysis…</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#F5F5F5] p-8 border border-gray-200">
                            {activeTab === 'issueTree' && <IssueTree issueTree={analysisResult?.issueTree} />}
                            {activeTab === 'hypotheses' && <Hypotheses hypotheses={analysisResult?.hypotheses} />}
                            {activeTab === 'recommendations' && <Recommendations recommendations={analysisResult?.recommendations} />}
                            {activeTab === 'chat' && <ChatInterface dataProfile={dataProfile} conn={conn} />}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
