import React from 'react';
import { X, RefreshCw, Layers, FilePlus } from 'lucide-react';

const DynamicRejectionModal = ({ isOpen, onClose, onSelectOption, materialName, rejectedQty }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden p-8 space-y-6 transform scale-100 transition-all duration-300 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Recut Recovery Options</h3>
            <p className="text-[10px] text-slate-400 mt-1">
              Select a mitigation pathway for <span className="font-bold text-rose-500">{rejectedQty} pcs</span> of rejected {materialName || 'material'}.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4">
          {/* Option 1: SAME SHEET */}
          <button
            onClick={() => onSelectOption('SAME_SHEET')}
            className="w-full text-left p-5 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 hover:scale-[1.01] active:scale-95 transition-all group flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Option 1: Same Sheet</h4>
              <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
                Reprocess instantly using the current sheets on the machine bed. No inventory stock deductions or requisition logs will be created.
              </p>
            </div>
          </button>

          {/* Option 2: USE EXCESS */}
          <button
            onClick={() => onSelectOption('USE_EXCESS')}
            className="w-full text-left p-5 rounded-2xl border border-teal-100 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300 hover:scale-[1.01] active:scale-95 transition-all group flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-teal-500 text-white shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider">Option 2: Use Floor Excess</h4>
              <p className="text-[10px] text-teal-600 mt-1 leading-relaxed">
                Consume material from the floor's retained buffer/excess stock metrics immediately. Ideal for utilizing scrap buffer without delaying cycles.
              </p>
            </div>
          </button>

          {/* Option 3: REQUEST NEW SHEET (EMR) */}
          <button
            onClick={() => onSelectOption('REQUEST_NEW_SHEET')}
            className="w-full text-left p-5 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 hover:scale-[1.01] active:scale-95 transition-all group flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Option 3: Request New Sheet (EMR)</h4>
              <p className="text-[10px] text-amber-600 mt-1 leading-relaxed">
                Submit an Extra Material Requisition (EMR) to the Store backend. 
                <span className="font-bold text-amber-800"> Locks this recut cycle until the Store issues the material.</span>
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default DynamicRejectionModal;
