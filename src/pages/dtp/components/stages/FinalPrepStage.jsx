import React, { useState } from 'react';
import PreFlightModal from './PreFlightModal';
import { getFileNamev2 } from '../../../../utils/helper/FilenameURL';
import ImageLightbox from '../../../common/ImageLightbox';

/*
   Main stage component
*/
const FinalPrepStage = ({ job, onUpload, onDelete, onDownload, isSalesPerson }) => {
    const [isPreFlightOpen, setIsPreFlightOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    // Lightbox state
    const [previewSrc, setPreviewSrc] = useState(null);
    const [previewName, setPreviewName] = useState('');

    const openPreview = (src, name) => { setPreviewSrc(src); setPreviewName(name); };
    const closePreview = () => setPreviewSrc(null);

    const sections = job.job_sheet?.materialprocess || [];
    const finalPrepFiles = job.final_prep_files || [];

    const handlePreFlightConfirm = (checks) => {
        if (!activeSection) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                onUpload({
                    materialGroupId: activeSection.material_group_id,
                    materialGroupName: activeSection.material_group_name,
                    fileType: 'production',
                    files,
                    preFlight: checks
                });
                setIsPreFlightOpen(false);
                setActiveSection(null);
            }
        };
        input.click();
    };

    const handleReferenceUpload = (section) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                onUpload({
                    materialGroupId: section.material_group_id,
                    materialGroupName: section.material_group_name,
                    fileType: 'reference',
                    files
                });
            }
        };
        input.click();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})/);
        if (match) {
            const [_, day, month, year] = match;
            return new Date(`${year}-${month}-${day}`).toLocaleDateString();
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
    };

    const getPreFlightInitialData = () => {
        if (!activeSection) return null;
        const prepData = finalPrepFiles.find(f => f.material_group_id === activeSection.material_group_id);
        if (!prepData) return null;
        const files = prepData.production_files || (prepData.production_file ? [prepData.production_file] : []);
        if (files.length > 0) return files[files.length - 1].pre_flight_checked;
        return null;
    };

    return (
        <>
            {/* ── Lightbox ── */}
            <ImageLightbox src={previewSrc} fileName={previewName} onClose={closePreview} />

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 font-primary">Final Breakdown &amp; QA</h2>
                </div>

                <div className="space-y-6">
                    {sections.map((section, idx) => {
                        const prepData = finalPrepFiles.find(f => f.material_group_id === section.material_group_id) || {};
                        const productionFiles = prepData.production_files || (prepData.production_file?.file_url ? [prepData.production_file] : []);
                        const referenceImages = prepData.reference_images || (prepData.reference_image?.file_url ? [prepData.reference_image] : []);

                        return (
                            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm transition-all hover:shadow-md">
                                <h3 className="text-lg font-bold text-slate-800 font-primary mb-6">
                                    {section.material_group_name}
                                </h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* ── Production Files ── */}
                                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 transition-colors flex flex-col gap-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                    <i className="fa-solid fa-file-lines" />
                                                </div>
                                                <div className="text-sm font-bold text-slate-700 font-primary">Production Files ({productionFiles.length})</div>
                                            </div>
                                            {!isSalesPerson && (
                                                <button
                                                    onClick={() => {
                                                        setActiveSection(section);
                                                        setIsPreFlightOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all font-primary shadow-sm flex items-center gap-1"
                                                >
                                                    <i className="fa-solid fa-plus" /> Add File
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {productionFiles.length === 0 ? (
                                                <div className="text-center py-4 text-xs text-slate-400 font-primary italic">No production files uploaded</div>
                                            ) : (
                                                productionFiles.map((fileObj, fIdx) => {
                                                    const fileUrl = fileObj.file_url;
                                                    const fileName = fileUrl ? getFileNamev2(fileUrl) : 'File';

                                                    return (
                                                        <div key={fileObj._id || fIdx} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-indigo-500 shrink-0">
                                                                    <i className="fa-solid fa-file-invoice" />
                                                                </div>
                                                                <div className="truncate">
                                                                    <div className="text-xs font-bold text-slate-700 truncate w-32" title={fileName}>{fileName}</div>
                                                                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{formatDate(fileObj.uploaded_at)}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => onDownload({ url: fileUrl })}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                                    title="Download"
                                                                >
                                                                    <i className="fa-solid fa-download text-xs" />
                                                                </button>
                                                                {!isSalesPerson && (
                                                                    <button
                                                                        onClick={() => onDelete({
                                                                            materialGroupId: section.material_group_id,
                                                                            fileType: 'production',
                                                                            fileId: fileObj._id,
                                                                            fileName
                                                                        })}
                                                                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <i className="fa-solid fa-trash text-xs" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Reference Images ── */}
                                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 transition-colors flex flex-col gap-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400">
                                                    <i className="fa-solid fa-images" />
                                                </div>
                                                <div className="text-sm font-bold text-slate-700 font-primary">Reference Images ({referenceImages.length})</div>
                                            </div>
                                            {!isSalesPerson && (
                                                <button
                                                    onClick={() => handleReferenceUpload(section)}
                                                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all font-primary shadow-sm flex items-center gap-1"
                                                >
                                                    <i className="fa-solid fa-plus" /> Add Image
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {referenceImages.length === 0 ? (
                                                <div className="text-center py-4 text-xs text-slate-400 font-primary italic">No reference images uploaded</div>
                                            ) : (
                                                referenceImages.map((fileObj, fIdx) => {
                                                    const fileUrl = fileObj.file_url;
                                                    const fileName = fileUrl ? getFileNamev2(fileUrl) : `Image ${fIdx + 1}`;

                                                    return (
                                                        <div key={fileObj._id || fIdx} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                {/* Thumbnail with eye + download overlay */}
                                                                <div className="relative w-12 h-12 rounded bg-slate-50 border border-slate-200 overflow-hidden group/thumb flex-shrink-0">
                                                                    <img
                                                                        src={fileUrl}
                                                                        alt="Ref"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                    {/* Hover overlay — eye & download */}
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                                        <button
                                                                            title="Preview"
                                                                            onClick={() => openPreview(fileUrl, fileName)}
                                                                            className="text-white hover:text-indigo-300 transition-colors"
                                                                        >
                                                                            <i className="fa-solid fa-eye text-xs" />
                                                                        </button>
                                                                        <button
                                                                            title="Download"
                                                                            onClick={() => onDownload({ url: fileUrl })}
                                                                            className="text-white hover:text-emerald-300 transition-colors"
                                                                        >
                                                                            <i className="fa-solid fa-download text-xs" />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="truncate">
                                                                    <div className="text-xs font-bold text-slate-700 truncate w-32" title={fileName}>{fileName}</div>
                                                                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{formatDate(fileObj.uploaded_at)}</div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => onDownload({ url: fileUrl })}
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                                    title="Download"
                                                                >
                                                                    <i className="fa-solid fa-download text-xs" />
                                                                </button>
                                                                {!isSalesPerson && (
                                                                    <button
                                                                        onClick={() => onDelete({
                                                                            materialGroupId: section.material_group_id,
                                                                            fileType: 'reference',
                                                                            fileId: fileObj._id,
                                                                            fileName
                                                                        })}
                                                                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <i className="fa-solid fa-trash text-xs" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <PreFlightModal
                    isOpen={isPreFlightOpen}
                    initialData={getPreFlightInitialData()}
                    onClose={() => {
                        setIsPreFlightOpen(false);
                        setActiveSection(null);
                    }}
                    onConfirm={handlePreFlightConfirm}
                    sectionName={activeSection?.material_group_name}
                />
            </div>
        </>
    );
};

export default FinalPrepStage;
